import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { AppUser, TenantCustomization } from "@/integrations/supabase/multi-tenant"

interface AuthContextType {
  user: AppUser | null
  tenant: { id: string; name: string; slug: string; primary_color: string } | null
  customization: TenantCustomization | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInAsMaster: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateCustomization: (data: Partial<TenantCustomization>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; primary_color: string } | null>(null)
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const loadTenantData = async (tenantId: string) => {
    try {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, slug, primary_color")
        .eq("id", tenantId)
        .single()

      if (tenantData) {
        setTenant(tenantData)
        document.title = tenantData.name || "LF Vendas"
      }

      const { data: customizationData } = await supabase
        .from("tenant_customizations")
        .select("*")
        .eq("tenant_id", tenantId)
        .single()

      if (customizationData) {
        setCustomization(customizationData)
      }
    } catch (err) {
      console.error("Error loading tenant:", err)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInAsMaster = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setTenant(null)
      setCustomization(null)
    } finally {
      setLoading(false)
    }
  }

  const updateCustomization = async (data: Partial<TenantCustomization>) => {
    if (!user?.tenant_id) return
    await supabase
      .from("tenant_customizations")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("tenant_id", user.tenant_id)
    await loadTenantData(user.tenant_id)
    toast.success("Personalização salva!")
  }

  const processSession = async (session: any) => {
    if (!session?.user) {
      setUser(null)
      setTenant(null)
      setCustomization(null)
      setInitialized(true)
      return
    }

    const email = session.user.email || ""
    
    try {
      const { data: tenantUser, error } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("email", email)
        .single()

      if (error || !tenantUser) {
        console.log("User not found in tenant_users")
        setUser(null)
        setInitialized(true)
        return
      }

      if (!tenantUser.active) {
        toast.error("Usuário desativado")
        setUser(null)
        setInitialized(true)
        return
      }

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, slug, primary_color")
        .eq("id", tenantUser.tenant_id)
        .single()

      setUser({
        id: session.user.id,
        email,
        role: tenantUser.role,
        tenant_id: tenantUser.tenant_id,
        tenant_name: tenantData?.name || null,
        tenant_slug: tenantData?.slug || null,
        customization: null
      })

      if (tenantData) {
        await loadTenantData(tenantData.id)
      }
    } catch (err) {
      console.error("Process session error:", err)
      setUser(null)
    }
    
    setInitialized(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => processSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (initialized) {
        processSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!initialized) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      customization,
      loading,
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