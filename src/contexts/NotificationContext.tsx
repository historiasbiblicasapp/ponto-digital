import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./AuthContext"

export interface AppNotification {
  id: string
  empresa_id: string | null
  funcionario_id: string | null
  tipo: string
  titulo: string
  mensagem: string | null
  lida: boolean
  created_at: string
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, company } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.lida).length

  const carregarNotificacoes = useCallback(async () => {
    if (!user) return
    try {
      let query = supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (user.role === "user" && user.funcionario?.id) {
        query = query.or(`funcionario_id.eq.${user.funcionario.id},empresa_id.eq.${user.funcionario.id}`)
      } else if (company?.id) {
        query = query.eq("empresa_id", company.id)
      }

      const { data } = await query
      if (data) setNotifications(data)
    } catch (err) {
      console.error("Erro ao carregar notificações:", err)
    } finally {
      setLoading(false)
    }
  }, [user, company])

  useEffect(() => {
    carregarNotificacoes()
  }, [carregarNotificacoes])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("notificacoes_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: company?.id ? `empresa_id=eq.${company.id}` : undefined,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification
          setNotifications(prev => [newNotif, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, company])

  const markAsRead = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const markAllAsRead = async () => {
    if (!company?.id) return
    await supabase.from("notificacoes").update({ lida: true }).eq("empresa_id", company.id)
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within NotificationProvider")
  return context
}
