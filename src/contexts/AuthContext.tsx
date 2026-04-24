import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
  const [user, setUser] = useState<AppUser | null>(null)
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; primary_color: string } | null>(null)
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user || !mounted) {
          setLoading(false)
          return
        }

        const email = session.user.email || ""
        console.log("Checking user:", email)

        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("*")
          .eq("email", email)
          .single()

        console.log("Tenant user found:", tenantUser)

        if (!tenantUser || !tenantUser.active) {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const { data: tenantData } = await supabase
          .from("tenants")
          .select("id, name, slug, primary_color")
          .eq("id", tenantUser.tenant_id)
          .single()

        console.log("Tenant data:", tenantData)

        if (tenantData && mounted) {
          setUser({
            id: session.user.id,
            email,
            role: tenantUser.role,
            tenant_id: tenantUser.tenant_id,
            tenant_name: tenantData.name,
            tenant_slug: tenantData.slug,
            customization: null
          })
          setTenant(tenantData)
          document.title = tenantData.name
        }
      } catch (err) {
        console.error("Auth check error:", err)
      }
      
      if (mounted) {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      if (!session) {
        setUser(null)
        setTenant(null)
        setCustomization(null)
        setLoading(false)
        return
      }

      const email = session.user.email || ""
      supabase
        .from("tenant_users")
        .select("*")
        .eq("email", email)
        .single()
        .then(({ data: tenantUser }) => {
          if (!tenantUser || !tenantUser.active || !mounted) {
            setUser(null)
            setLoading(false)
            return
          }

          supabase
            .from("tenants")
            .select("id, name, slug, primary_color")
            .eq("id", tenantUser.tenant_id)
            .single()
            .then(({ data: tenantData }) => {
              if (tenantData && mounted) {
                setUser({
                  id: session.user.id,
                  email,
                  role: tenantUser.role,
                  tenant_id: tenantUser.tenant_id,
                  tenant_name: tenantData.name,
                  tenant_slug: tenantData.slug,
                  customization: null
                })
                setTenant(tenantData)
                document.title = tenantData.name
                setLoading(false)
              }
            })
        })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
    setLoading(true)
    await supabase.auth.signOut()
    const wasMaster = user?.tenant_slug === "master"
    setUser(null)
    setTenant(null)
    setCustomization(null)
    setLoading(false)
    navigate(wasMaster ? "/admin" : "/login")
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