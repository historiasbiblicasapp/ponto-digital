import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { AppUser, TenantCustomization } from "@/integrations/supabase/multi-tenant"

interface AuthContextType {
  user: AppUser | null
  tenant: { id: string; name: string; slug: string; primary_color: string } | null
  customization: TenantCustomization | null
  loading: boolean
  isMasterAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInAsMaster: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateCustomization: (data: Partial<TenantCustomization>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const createDeviceId = () => {
  const stored = localStorage.getItem("device_id")
  if (stored) return stored
  const newId = "device_" + Math.random().toString(36).substring(2) + Date.now().toString(36)
  localStorage.setItem("device_id", newId)
  return newId
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; primary_color: string } | null>(null)
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTenantData = useCallback(async (tenantId: string) => {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id, name, slug, primary_color")
      .eq("id", tenantId)
      .single()

    if (tenantData) {
      setTenant(tenantData)
    }

    const { data: customizationData } = await supabase
      .from("tenant_customizations")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (customizationData) {
      setCustomization(customizationData)
    }
  }, [])

  const loadMasterData = useCallback(async () => {
    setTenant({ id: "master", name: "Admin Master", slug: "master", primary_color: "#16a34a" })
    setCustomization({
      id: "master",
      tenant_id: "master",
      app_name: "LF Vendas Admin",
      primary_color: "#16a34a",
      secondary_color: "#22c55e",
      logo_url: null,
      favicon_url: null,
      updated_at: new Date().toISOString()
    })
  }, [])

  const checkAndCreateSession = async (userId: string, tenantId: string | null, isMaster: boolean = false) => {
    if (isMaster) return

    const deviceId = createDeviceId()

    const { data: existingSessions } = await supabase
      .from("user_sessions")
      .select("id, device_id")
      .eq("user_id", userId)

    const existingDevice = existingSessions?.find(s => s.device_id === deviceId)

    if (existingDevice) {
      await supabase
        .from("user_sessions")
        .update({ last_active: new Date().toISOString(), tenant_id: tenantId })
        .eq("id", existingDevice.id)
    } else {
      if (tenantId) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("max_sessions")
          .eq("id", tenantId)
          .single()

        if (tenantData) {
          const activeCount = (existingSessions?.length || 0)
          if (activeCount >= tenantData.max_sessions) {
            throw new Error(`Limite de ${tenantData.max_sessions} dispositivos simultâneos atingido`)
          }
        }
      }

      const { error } = await supabase
        .from("user_sessions")
        .insert({ user_id: userId, device_id: deviceId, tenant_id: tenantId })

      if (error && !error.message.includes("duplicate")) {
        console.error("Session error:", error)
      }
    }
  }

  const removeSession = async (userId: string) => {
    const deviceId = localStorage.getItem("device_id")
    if (!deviceId || !userId) return

    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("device_id", deviceId)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || ""

        if (email === "master@lfvendas.com") {
          setUser({
            id: session.user.id,
            email,
            role: "master",
            tenant_id: null,
            tenant_name: null,
            tenant_slug: null,
            customization: null
          })
          await loadMasterData()
        } else {
          const { data: tenantUser } = await supabase
            .from("tenant_users")
            .select("*, tenants(id, name, slug, primary_color)")
            .eq("email", email)
            .eq("active", true)
            .single()

          if (tenantUser) {
            setUser({
              id: session.user.id,
              email,
              role: tenantUser.role as "admin" | "user",
              tenant_id: tenantUser.tenant_id,
              tenant_name: (tenantUser.tenants as any)?.name || null,
              tenant_slug: (tenantUser.tenants as any)?.slug || null,
              customization: null
            })
            await loadTenantData(tenantUser.tenant_id)
            await checkAndCreateSession(session.user.id, tenantUser.tenant_id)
          } else {
            await supabase.auth.signOut()
          }
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email || ""

        if (email === "master@lfvendas.com") {
          setUser({
            id: session.user.id,
            email,
            role: "master",
            tenant_id: null,
            tenant_name: null,
            tenant_slug: null,
            customization: null
          })
          await loadMasterData()
        } else {
          const { data: tenantUser } = await supabase
            .from("tenant_users")
            .select("*, tenants(id, name, slug, primary_color)")
            .eq("email", email)
            .eq("active", true)
            .single()

          if (tenantUser) {
            setUser({
              id: session.user.id,
              email,
              role: tenantUser.role as "admin" | "user",
              tenant_id: tenantUser.tenant_id,
              tenant_name: (tenantUser.tenants as any)?.name || null,
              tenant_slug: (tenantUser.tenants as any)?.slug || null,
              customization: null
            })
            await loadTenantData(tenantUser.tenant_id)
            await checkAndCreateSession(session.user.id, tenantUser.tenant_id)
          }
        }
      } else {
        setUser(null)
        setTenant(null)
        setCustomization(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadTenantData, loadMasterData])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.session?.user) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("*, tenants(id, name, slug, primary_color)")
        .eq("email", email)
        .eq("active", true)
        .single()

      if (tenantUser) {
        await checkAndCreateSession(data.session.user.id, tenantUser.tenant_id)
      }
    }
  }

  const signInAsMaster = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (user) {
      await removeSession(user.id)
    }
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    setCustomization(null)
  }

  const updateCustomization = async (data: Partial<TenantCustomization>) => {
    if (!user?.tenant_id) return

    const { error } = await supabase
      .from("tenant_customizations")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("tenant_id", user.tenant_id)

    if (error) throw error

    await loadTenantData(user.tenant_id)
    toast.success("Personalização salva!")
  }

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      customization,
      loading,
      isMasterAdmin: user?.role === "master",
      signIn,
      signInAsMaster,
      signOut,
      updateCustomization
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}