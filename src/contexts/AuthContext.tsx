import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { AppUser, TenantCustomization } from "@/integrations/supabase/multi-tenant"

interface AuthContextType {
  user: AppUser | null
  tenant: { id: string; name: string; slug: string; primary_color: string } | null
  customization: TenantCustomization | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInAsMaster: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; primary_color: string } | null>(null)
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(true)

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

  const processUser = async (session: any) => {
    if (!session?.user) {
      setUser(null)
      setTenant(null)
      setCustomization(null)
      setLoading(false)
      return
    }

    const email = session.user.email || ""
    
    try {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("email", email)
        .single()

      if (tenantUser && tenantUser.active) {
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
      } else {
        setUser(null)
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error("Process user error:", err)
      setUser(null)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => processUser(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processUser(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
  }

  const signInAsMaster = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    setCustomization(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      customization,
      loading,
      signIn,
      signInAsMaster,
      signOut
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