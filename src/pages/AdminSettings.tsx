import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Building2, MapPin, Shield, Smartphone, Save, Plus, Trash2 } from "lucide-react"
import type { Filial, Dispositivo } from "@/integrations/supabase/ponto-digital"
import { PLANOS_SAAS } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, GRID, TEXT, FLEX } from "@/lib/design-system"

const AdminSettings = () => {
  const { company, user, refreshUser } = useAuth()
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [companyForm, setCompanyForm] = useState({
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    email: "",
    telefone: "",
  })

  const [novaFilial, setNovaFilial] = useState({
    nome: "", endereco: "", latitude: "", longitude: "", raio_geofence: 100,
  })

  const [novoDispositivo, setNovoDispositivo] = useState({
    nome: "", tipo: "tablet", localizacao: "",
  })

  useEffect(() => {
    if (company) {
      setCompanyForm({
        nome_fantasia: company.nome_fantasia || "",
        razao_social: company.razao_social || "",
        cnpj: company.cnpj || "",
        email: company.email || "",
        telefone: company.telefone || "",
      })
      carregarDados()
    }
  }, [company])

  const carregarDados = async () => {
    if (!company?.id) return
    try {
      const [filialRes, dispRes] = await Promise.all([
        supabase.from("filiais").select("*").eq("empresa_id", company.id),
        supabase.from("dispositivos").select("*").eq("empresa_id", company.id),
      ])
      if (filialRes.data) setFiliais(filialRes.data)
      if (dispRes.data) setDispositivos(dispRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveCompany = async () => {
    if (!company?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("tenants")
        .update(companyForm)
        .eq("id", company.id)

      if (error) throw error
      toast.success("Dados da empresa atualizados!")
      await refreshUser()
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const addFilial = async () => {
    if (!company?.id || !novaFilial.nome) return
    try {
      const { error } = await supabase.from("filiais").insert({
        empresa_id: company.id,
        nome: novaFilial.nome,
        endereco: novaFilial.endereco || null,
        latitude: novaFilial.latitude || null,
        longitude: novaFilial.longitude || null,
        raio_geofence: novaFilial.raio_geofence,
      })
      if (error) throw error
      toast.success("Filial adicionada!")
      setNovaFilial({ nome: "", endereco: "", latitude: "", longitude: "", raio_geofence: 100 })
      carregarDados()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const removeFilial = async (id: string) => {
    try {
      const { error } = await supabase.from("filiais").delete().eq("id", id)
      if (error) throw error
      toast.success("Filial removida")
      carregarDados()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const addDispositivo = async () => {
    if (!company?.id || !novoDispositivo.nome) return
    try {
      const { error } = await supabase.from("dispositivos").insert({
        empresa_id: company.id,
        nome: novoDispositivo.nome,
        tipo: novoDispositivo.tipo,
        localizacao: novoDispositivo.localizacao || null,
      })
      if (error) throw error
      toast.success("Dispositivo cadastrado!")
      setNovoDispositivo({ nome: "", tipo: "tablet", localizacao: "" })
      carregarDados()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const removeDispositivo = async (id: string) => {
    try {
      const { error } = await supabase.from("dispositivos").delete().eq("id", id)
      if (error) throw error
      toast.success("Dispositivo removido")
      carregarDados()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className={STACK.page}>
      <div>
        <h1 className={TEXT.pageTitle}>Configurações</h1>
        <p className={TEXT.body}>Gerencie sua empresa</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="empresa" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Empresa</span>
            <span className="sm:hidden">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="filiais" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filiais</span>
            <span className="sm:hidden">Filiais</span>
          </TabsTrigger>
          <TabsTrigger value="dispositivos" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Dispositivos</span>
            <span className="sm:hidden">Dispositivos</span>
          </TabsTrigger>
          <TabsTrigger value="plano" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Plano</span>
            <span className="sm:hidden">Plano</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className={GRID.form2}>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Nome Fantasia</Label>
                <Input
                  value={companyForm.nome_fantasia}
                  onChange={(e) => setCompanyForm({ ...companyForm, nome_fantasia: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Razão Social</Label>
                <Input
                  value={companyForm.razao_social}
                  onChange={(e) => setCompanyForm({ ...companyForm, razao_social: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>CNPJ</Label>
                <Input
                  value={companyForm.cnpj}
                  onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Email</Label>
                <Input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Telefone</Label>
                <Input
                  value={companyForm.telefone}
                  onChange={(e) => setCompanyForm({ ...companyForm, telefone: e.target.value })}
                />
              </div>
            </div>
            <Button className="mt-6" onClick={saveCompany} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="filiais" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
              <Input
                placeholder="Nome da filial"
                value={novaFilial.nome}
                onChange={(e) => setNovaFilial({ ...novaFilial, nome: e.target.value })}
                className="sm:flex-1"
              />
              <Input
                placeholder="Endereço"
                value={novaFilial.endereco}
                onChange={(e) => setNovaFilial({ ...novaFilial, endereco: e.target.value })}
                className="sm:flex-[2]"
              />
              <Input
                placeholder="Raio (m)"
                type="number"
                value={novaFilial.raio_geofence}
                onChange={(e) => setNovaFilial({ ...novaFilial, raio_geofence: Number(e.target.value) })}
                className="sm:w-28"
              />
              <Button onClick={addFilial} className="sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
            {filiais.map((f) => (
              <div key={f.id} className={FLEX.between + " p-3 bg-muted/50 rounded-lg mb-2"}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">{f.nome}</p>
                  <p className={TEXT.small + " truncate"}>{f.endereco || "Sem endereço"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFilial(f.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="dispositivos" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
              <Input
                placeholder="Nome do dispositivo"
                value={novoDispositivo.nome}
                onChange={(e) => setNovoDispositivo({ ...novoDispositivo, nome: e.target.value })}
                className="sm:flex-1"
              />
              <Select
                value={novoDispositivo.tipo}
                onValueChange={(v) => setNovoDispositivo({ ...novoDispositivo, tipo: v })}
              >
                <SelectTrigger className="sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="totem">Totem</SelectItem>
                  <SelectItem value="computador">Computador</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Localização"
                value={novoDispositivo.localizacao}
                onChange={(e) => setNovoDispositivo({ ...novoDispositivo, localizacao: e.target.value })}
                className="sm:flex-1"
              />
              <Button onClick={addDispositivo} className="sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
            {dispositivos.map((d) => (
              <div key={d.id} className={FLEX.between + " p-3 bg-muted/50 rounded-lg mb-2"}>
                <div className={FLEX.center}>
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{d.nome}</p>
                    <p className={TEXT.small + " truncate"}>
                      {d.tipo} {d.localizacao ? `- ${d.localizacao}` : ""}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeDispositivo(d.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className={GRID.cards3}>
              {PLANOS_SAAS.map((plano) => (
                <Card
                  key={plano.id}
                  className={`p-4 sm:p-6 text-center cursor-pointer transition-all hover:shadow-lg ${
                    company?.plano === plano.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <h3 className="font-bold text-sm sm:text-lg">{plano.nome}</h3>
                  <p className="text-xl sm:text-3xl font-bold mt-2">
                    R${plano.preco}
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className={TEXT.body + " mt-2"}>
                    até {plano.limite_funcionarios === 999999 ? "∞" : plano.limite_funcionarios} funcionários
                  </p>
                  {company?.plano === plano.id && (
                    <p className="text-xs sm:text-sm font-semibold text-primary mt-2">Plano atual</p>
                  )}
                </Card>
              ))}
            </div>
            <p className={TEXT.body + " mt-6 text-center"}>
              Para alterar seu plano, entre em contato com o suporte.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettings
