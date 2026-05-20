import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Building2, Search, Users, ToggleLeft, ToggleRight, AlertTriangle, Copy, Check, ExternalLink } from "lucide-react"
import type { Tenant } from "@/integrations/supabase/multi-tenant"
import { PLANOS_SAAS } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID, DIALOG, BUTTON } from "@/lib/design-system"

const MasterTenants = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", slug: "", razao_social: "", nome_fantasia: "",
    cnpj: "", email: "", telefone: "", plano: "basico",
    limite_funcionarios: 10, active: true, primary_color: "#16a34a", usa_almoco: true,
  })

  // Success dialog
  const [successData, setSuccessData] = useState<{ name: string; slug: string; email: string; password: string; url: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Tenant | null>(null)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["master-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data as Tenant[]
    },
  })

  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("https://svvbfshcpetazsrgnyac.supabase.co/functions/v1/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmJmc2hjcGV0YXpzcmdueWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzMxNDMsImV4cCI6MjA5NDQ0OTE0M30.7cgDQjvVClYYpqaIiU7acrM2_sGKFsqmKndvcw4cyHI",
        },
        body: JSON.stringify({
          name: form.name, slug: form.slug,
          razao_social: form.razao_social || null,
          nome_fantasia: form.nome_fantasia || null,
          cnpj: form.cnpj || null, email: form.email || null,
          telefone: form.telefone || null, plano: form.plano,
          limite_funcionarios: form.limite_funcionarios,
          primary_color: form.primary_color,
          usa_almoco: form.usa_almoco,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(errBody || "Erro ao criar empresa")
      }

      return await res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-tenants"] })
      setCreateOpen(false)
      limparForm()
      setTimeout(() => {
        setSuccessData({
          name: data.tenant.nome_fantasia || data.tenant.name,
          slug: data.tenant.slug,
          email: data.adminEmail,
          password: data.adminPassword,
          url: `https://pontoeletronicoDigital.netlify.app`,
        })
      }, 300)
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar"),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editForm) return
      const { error } = await supabase.from("tenants").update({
        name: editForm.name, slug: editForm.slug,
        razao_social: editForm.razao_social,
        nome_fantasia: editForm.nome_fantasia,
        cnpj: editForm.cnpj, email: editForm.email,
        telefone: editForm.telefone, plano: editForm.plano,
        limite_funcionarios: editForm.limite_funcionarios,
        active: editForm.active, primary_color: editForm.primary_color,
        usa_almoco: editForm.usa_almoco !== false,
      }).eq("id", editForm.id)
      if (error) throw error
      toast.success("Empresa atualizada!")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-tenants"] })
      setEditOpen(false)
      setEditForm(null)
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar"),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (tenant: Tenant) => {
      const { error } = await supabase.from("tenants").update({
        active: !tenant.active,
      }).eq("id", tenant.id)
      if (error) throw error
      toast.success(`${tenant.nome_fantasia || tenant.name} ${tenant.active ? "desativada" : "ativada"}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-tenants"] }),
    onError: (err: any) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return
      const { error } = await supabase.from("tenants").delete().eq("id", deleteTarget.id)
      if (error) throw error
      toast.success("Empresa excluída permanentemente")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-tenants"] })
      setDeleteOpen(false)
      setDeleteTarget(null)
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir"),
  })

  const limparForm = () => {
    setForm({
      name: "", slug: "", razao_social: "", nome_fantasia: "",
      cnpj: "", email: "", telefone: "", plano: "basico",
      limite_funcionarios: 10, active: true, primary_color: "#16a34a",
    })
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const filtered = tenants.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.cnpj?.includes(search) ||
    t.razao_social?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div>
          <h1 className={TEXT.pageTitle}>Empresas</h1>
          <p className={TEXT.body}>{tenants.length} empresas cadastradas</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className={BUTTON.primary}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className={DIALOG.content}>
            <DialogHeader className={DIALOG.header}>
              <DialogTitle>Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className={GRID.form2}>
              <div className="col-span-1 sm:col-span-2">
                <div className={STACK.tight}>
                  <Label className={TEXT.label}>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({
                    ...form, name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })} />
                </div>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Razão Social</Label>
                <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Plano</Label>
                <Select value={form.plano} onValueChange={(v) => {
                  const plano = PLANOS_SAAS.find(p => p.id === v)
                  setForm({ ...form, plano: v, limite_funcionarios: plano?.limite_funcionarios || 10 })
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANOS_SAAS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} - R${p.preco}/mês ({p.limite_funcionarios === 999999 ? "∞" : p.limite_funcionarios} func.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Limite Funcionários</Label>
                <Input type="number" value={form.limite_funcionarios}
                  onChange={(e) => setForm({ ...form, limite_funcionarios: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch id="usa_almoco" checked={form.usa_almoco !== false}
                onCheckedChange={(v) => setForm({ ...form, usa_almoco: v })} />
              <Label htmlFor="usa_almoco">Usa controle de almoço</Label>
            </div>
            <Button className="w-full mt-4" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Empresa"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar empresas..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className={GRID.cards3}>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-5 w-32 ml-3" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className={GRID.cards3}>
          {filtered.map((t) => (
            <Card key={t.id} className="hover:shadow-lg transition-shadow relative group">
              <CardHeader className="pb-3">
                <div className={FLEX.start}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg shrink-0"
                    style={{ backgroundColor: t.primary_color || "#16a34a" }}>
                    {(t.nome_fantasia || t.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">{t.nome_fantasia || t.name}</CardTitle>
                    <p className={TEXT.small + " truncate"}>{t.razao_social || t.slug}</p>
                  </div>
                  <Badge variant="outline" className={t.active ? "bg-green-50 text-green-700 shrink-0" : "bg-red-50 text-red-700 shrink-0"}>
                    {t.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className={STACK.tight + " text-xs sm:text-sm"}>
                  {t.cnpj && <p>CNPJ: {t.cnpj}</p>}
                  <p>Plano: {PLANOS_SAAS.find(p => p.id === t.plano)?.nome || t.plano || "Básico"}</p>
                  <p>Limite: {t.limite_funcionarios} funcionários</p>
                  <p className={TEXT.small}>Criado em {new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </CardContent>
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="w-7 h-7" title="Editar"
                  onClick={() => { setEditForm({ ...t }); setEditOpen(true) }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-amber-500 hover:text-amber-600" title="Ativar/Desativar"
                  onClick={() => toggleActiveMutation.mutate(t)}>
                  {t.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" title="Excluir"
                  onClick={() => { setDeleteTarget(t); setDeleteOpen(true) }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhuma empresa encontrada
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className={DIALOG.content}>
          <DialogHeader className={DIALOG.header}>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className={GRID.form2}>
              <div className="col-span-1 sm:col-span-2">
                <div className={STACK.tight}>
                  <Label className={TEXT.label}>Nome *</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({
                    ...editForm, name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })} />
                </div>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Slug</Label>
                <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>CNPJ</Label>
                <Input value={editForm.cnpj || ""} onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Razão Social</Label>
                <Input value={editForm.razao_social || ""} onChange={(e) => setEditForm({ ...editForm, razao_social: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Nome Fantasia</Label>
                <Input value={editForm.nome_fantasia || ""} onChange={(e) => setEditForm({ ...editForm, nome_fantasia: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Email</Label>
                <Input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Telefone</Label>
                <Input value={editForm.telefone || ""} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Plano</Label>
                <Select value={editForm.plano || "basico"} onValueChange={(v) => {
                  const plano = PLANOS_SAAS.find(p => p.id === v)
                  setEditForm({ ...editForm, plano: v, limite_funcionarios: plano?.limite_funcionarios || 10 })
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANOS_SAAS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} - R${p.preco}/mês</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Limite Funcionários</Label>
                <Input type="number" value={editForm.limite_funcionarios}
                  onChange={(e) => setEditForm({ ...editForm, limite_funcionarios: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit_usa_almoco" checked={editForm.usa_almoco !== false}
                  onCheckedChange={(v) => setEditForm({ ...editForm, usa_almoco: v })} />
                <Label htmlFor="edit_usa_almoco">Usa controle de almoço</Label>
              </div>
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!successData} onOpenChange={(open) => { if (!open) setSuccessData(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" /> Empresa Criada com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-sm">
              Os dados de acesso para <strong>{successData?.name}</strong>:
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="space-y-4">
              <div className="bg-glass rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Link de acesso</span>
                  <div className="flex items-center gap-2">
                    <a href={successData.url} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs truncate max-w-[200px]">
                      {successData.url} <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    <button onClick={() => copyToClipboard("url", successData.url)}
                      className="p-1 rounded hover:bg-glass transition-colors">
                      {copiedField === "url" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium">{successData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email admin</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{successData.email}</span>
                    <button onClick={() => copyToClipboard("email", successData.email)}
                      className="p-1 rounded hover:bg-glass transition-colors">
                      {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Senha</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs font-mono">{successData.password}</span>
                    <button onClick={() => copyToClipboard("senha", successData.password)}
                      className="p-1 rounded hover:bg-glass transition-colors">
                      {copiedField === "senha" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  copyToClipboard("all", `Link: ${successData.url}\nEmpresa: ${successData.name}\nAdmin: ${successData.email}\nSenha: ${successData.password}`)
                  toast.success("Dados copiados!")
                }}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar Tudo
                </Button>
                <Button className="flex-1" onClick={() => setSuccessData(null)}>
                  OK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Excluir Empresa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome_fantasia || deleteTarget?.name}</strong>?
              Esta ação é irreversível e removerá todos os dados relacionados (funcionários, registros, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Permanentemente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MasterTenants
