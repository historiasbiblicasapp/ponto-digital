import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Clock, Building2, ArrowRight, Shield, Sparkles, Copy, Check } from "lucide-react"
import type { Tenant } from "@/integrations/supabase/multi-tenant"

const CompanyLogin = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Tenant[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("active", true)
      .order("name")
    if (data) setCompanies(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success("Login realizado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar")
    } finally { setLoading(false) }
  }

  const selectAdminEmail = (slug: string) => {
    setEmail(`${slug}@admin.pontodigital.com`)
    setPassword("admin123")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copiado!")
  }

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-neon-blue/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative"
      >
        <Card className="glass-card-premium border-glass-border shadow-premium">
          <CardHeader className="text-center space-y-5 pt-10 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center shadow-neon"
            >
              <Clock className="w-10 h-10 text-black" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">
                <span className="text-gradient">Ponto Digital</span>
                <span className="block text-sm font-normal text-muted-foreground mt-1">BM</span>
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground/80">
                Sistema de Ponto Eletrônico Online
              </CardDescription>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> LGPD</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Portaria 671</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Multi-empresa</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            {/* Company list */}
            {companies.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Empresas disponíveis
                </p>
                <div className="space-y-2">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (c.email && c.email.includes("@admin.pontodigital.com")) {
                          selectAdminEmail(c.slug)
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-glass border border-glass-border hover:border-primary/30 transition-all text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: c.primary_color || "#16a34a" }}
                      >
                        {(c.nome_fantasia || c.name).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.nome_fantasia || c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          admin: {c.slug}@admin.pontodigital.com
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(`${c.slug}@admin.pontodigital.com`)
                        }}
                        className="p-1.5 rounded-lg hover:bg-glass transition-colors shrink-0"
                        title="Copiar email admin"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-glass-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">faça login</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="h-12 text-base bg-glass border-glass-border focus:border-primary/50 transition-colors"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="h-12 text-base bg-glass border-glass-border focus:border-primary/50 transition-colors"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="neo-button w-full h-12 text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full h-12 text-base gap-3 bg-glass border-glass-border hover:bg-glass/80 transition-all"
              onClick={() => navigate("/kiosk")}
            >
              <Building2 className="w-5 h-5" />
              Modo Tablet (Kiosk)
            </Button>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground/50 mt-6"
        >
          Ponto Digital BM v2.0 • Conforme Portaria MTP 671/2021
        </motion.p>
      </motion.div>
    </div>
  )
}

export default CompanyLogin
