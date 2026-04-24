import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ShoppingCart, ChevronDown } from "lucide-react"
import type { Tenant } from "@/integrations/supabase/multi-tenant"

const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantList, setShowTenantList] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, slug, primary_color, active")
      .eq("active", true)
      .order("name")

    if (!error && data) {
      setTenants(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        if (!selectedTenant) {
          toast.error("Selecione uma loja primeiro")
          setLoading(false)
          return
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              tenant_id: selectedTenant.id,
              tenant_name: selectedTenant.name
            }
          }
        })
        if (authError) throw authError

        if (authData.user) {
          const { error: linkError } = await supabase.from("tenant_users").insert({
            tenant_id: selectedTenant.id,
            email,
            role: "user"
          })
          if (linkError) throw linkError
        }

        toast.success("Conta criada com sucesso!")
        setIsSignUp(false)
        setTimeout(() => navigate("/vendas"), 100)
      } else {
        await signIn(email, password)
        toast.success("Login realizado com sucesso!")
        setTimeout(() => navigate("/vendas"), 100)
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-6">
          <ShoppingCart className="mx-auto w-24 h-24 text-primary" />
          <CardTitle className="text-3xl font-bold">LF Vendas</CardTitle>
          <p className="text-muted-foreground text-base">
            {isSignUp ? "Crie sua conta" : "Faça login para acessar"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label className="text-base">Selecione a Loja</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTenantList(!showTenantList)}
                    className="w-full h-12 px-4 flex items-center justify-between border rounded-lg bg-background text-left"
                  >
                    {selectedTenant ? (
                      <span className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: selectedTenant.primary_color || "#16a34a" }}
                        >
                          {selectedTenant.name.charAt(0).toUpperCase()}
                        </div>
                        {selectedTenant.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Selecione uma loja...</span>
                    )}
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                  {showTenantList && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {tenants.map((tenant) => (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setShowTenantList(false)
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted text-left"
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: tenant.primary_color || "#16a34a" }}
                          >
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="h-12 text-base"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-base text-muted-foreground py-3 hover:text-foreground transition-colors"
          >
            {isSignUp ? "Já tem conta? Faça login" : "Primeiro acesso? Crie sua conta"}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login