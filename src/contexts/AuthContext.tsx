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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; primary_color: string } | null>(null)
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTenantData = useCallback(async (tenantId: string) => {
    try {
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
    } catch (err) {
      console.error("Error loading tenant data:", err)
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const email = session.user.email || ""
          await processUser(session.user.id, email)
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email || ""
        await processUser(session.user.id, email)
      } else {
        setUser(null)
        setTenant(null)
        setCustomization(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const processUser = async (userId: string, email: string) => {
    try {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("email", email)
        .eq("active", true)
        .single()

      if (tenantUser) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("id, name, slug, primary_color")
          .eq("id", tenantUser.tenant_id)
          .single()

        setUser({
          id: userId,
          email,
          role: tenantUser.role as "admin" | "user",
          tenant_id: tenantUser.tenant_id,
          tenant_name: tenantData?.name || null,
          tenant_slug: tenantData?.slug || null,
          customization: null
        })
        await loadTenantData(tenantUser.tenant_id)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Process user error:", err)
      setUser(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInAsMaster = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
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