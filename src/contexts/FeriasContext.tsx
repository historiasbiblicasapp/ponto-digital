import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { supabase } from "@/integrations/supabase/client"
import type { Ferias } from "@/integrations/supabase/ponto-digital"

interface SaldoFerias {
  dias_direito: number
  dias_utilizados: number
  dias_agendados: number
  saldo: number
  anos_trabalhados: number
}

interface FeriasContextType {
  ferias: Ferias[]
  saldo: SaldoFerias | null
  loading: boolean
  solicitarFerias: (data: {
    data_inicio: string
    data_fim: string
    dias: number
    observacao?: string
  }) => Promise<void>
  cancelarFerias: (id: string) => Promise<void>
  aprovarFerias: (id: string, observacao?: string) => Promise<void>
  recusarFerias: (id: string, observacao?: string) => Promise<void>
  refresh: () => Promise<void>
}

const FeriasContext = createContext<FeriasContextType | null>(null)

export function FeriasProvider({ children }: { children: ReactNode }) {
  const { user, company } = useAuth()
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [saldo, setSaldo] = useState<SaldoFerias | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!user || !company?.id) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    ;(async () => {
      setLoading(true)
      try {
        if (user.role === "user" && user.funcionario) {
          const { data } = await supabase
            .from("ferias")
            .select("*")
            .eq("funcionario_id", user.funcionario.id)
            .order("created_at", { ascending: false })
          if (data) setFerias(data)

          const { data: saldoData } = await supabase
            .from("view_saldo_ferias")
            .select("*")
            .eq("funcionario_id", user.funcionario.id)
            .single()
          if (saldoData) setSaldo(saldoData)
        } else if (user.role === "admin" || user.role === "master") {
          const { data } = await supabase
            .from("ferias")
            .select("*, funcionarios!inner(nome, matricula)")
            .eq("empresa_id", company.id)
            .order("created_at", { ascending: false })
          if (data) setFerias(data)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id, company?.id])

  const refresh = async () => {
    fetchedRef.current = false
    if (!user || !company?.id) return
    setLoading(true)
    try {
      if (user.role === "user" && user.funcionario) {
        const { data } = await supabase.from("ferias").select("*").eq("funcionario_id", user.funcionario.id).order("created_at", { ascending: false })
        if (data) setFerias(data)
        const { data: saldoData } = await supabase.from("view_saldo_ferias").select("*").eq("funcionario_id", user.funcionario.id).single()
        if (saldoData) setSaldo(saldoData)
      } else {
        const { data } = await supabase.from("ferias").select("*, funcionarios!inner(nome, matricula)").eq("empresa_id", company.id).order("created_at", { ascending: false })
        if (data) setFerias(data)
      }
    } finally { setLoading(false) }
  }

  const solicitarFerias = async (dados: { data_inicio: string; data_fim: string; dias: number; observacao?: string }) => {
    if (!user?.funcionario || !company?.id) throw new Error("Usuário não vinculado a funcionário")
    const { error } = await supabase.from("ferias").insert({
      funcionario_id: user.funcionario.id,
      empresa_id: company.id,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      dias: dados.dias,
      observacao: dados.observacao || null,
      status: "agendada",
      tipo: "gozo",
    })
    if (error) throw error
    await refresh()
  }

  const cancelarFerias = async (id: string) => {
    const { error } = await supabase
      .from("ferias")
      .update({ status: "cancelada" })
      .eq("id", id)
    if (error) throw error
    await refresh()
  }

  const aprovarFerias = async (id: string, observacao?: string) => {
    if (!user?.funcionario) return
    const { error } = await supabase
      .from("ferias")
      .update({ status: "concedida", aprovado_por: user.funcionario.id, observacao: observacao || null })
      .eq("id", id)
    if (error) throw error
    await refresh()
  }

  const recusarFerias = async (id: string, observacao?: string) => {
    const { error } = await supabase
      .from("ferias")
      .update({ status: "cancelada", observacao: observacao || null })
      .eq("id", id)
    if (error) throw error
    await refresh()
  }

  return (
    <FeriasContext.Provider value={{ ferias, saldo, loading, solicitarFerias, cancelarFerias, aprovarFerias, recusarFerias, refresh }}>
      {children}
    </FeriasContext.Provider>
  )
}

export function useFerias() {
  const ctx = useContext(FeriasContext)
  if (!ctx) throw new Error("useFerias must be used within FeriasProvider")
  return ctx
}
