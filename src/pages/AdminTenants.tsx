import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import type { Tenant, TenantInsert } from "@/integrations/supabase/multi-tenant"
import { useAuth } from "@/contexts/AuthContext"

const AdminTenants = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    max_sessions: 2,
    primary_color: "#16a34a",
    active: true
  })
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "user" as "admin" | "user" })
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showUsers, setShowUsers] = useState(false)

  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      console.log("Fetching tenants...")
      const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false })
      console.log("Tenants response:", data, error)
      if (error) throw error
      return data
    },
    retry: 1
  })

  const { data: tenantUsers = [] } = useQuery({
    queryKey: ["tenant-users", selectedTenant?.id],
    queryFn: async () => {
      if (!selectedTenant) return []
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("tenant_id", selectedTenant.id)
      if (error) throw error
      return data
    },
    enabled: !!selectedTenant
  })

  const createTenantMutation = useMutation({
    mutationFn: async (tenant: TenantInsert) => {
      const { data, error } = await supabase.from("tenants").insert(tenant).select().single()
      if (error) throw error
      return data
    },
    onSuccess: async (tenant) => {
      await supabase.from("tenant_customizations").insert({
        tenant_id: tenant.id,
        app_name: tenant.name,
        primary_color: tenant.primary_color
      })
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
      setOpen(false)
      resetForm()
      toast.success("Cliente criado com sucesso!")
    },
    onError: () => toast.error("Erro ao criar cliente")
  })

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, ...data }: Tenant) => {
      const { error } = await supabase.from("tenants").update(data).eq("id", id)
      if (error) throw error
    },
    onSuccess: async (data, tenant) => {
      await supabase.from("tenant_customizations").update({
        app_name: tenant.name,
        primary_color: tenant.primary_color
      }).eq("tenant_id", tenant.id)
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
      setOpen(false)
      resetForm()
      toast.success("Cliente atualizado!")
    },
    onError: () => toast.error("Erro ao atualizar cliente")
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("tenants").update({ active }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })
      toast.success("Status atualizado!")
    }
  })

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: string }) => {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      if (authError) throw authError

      const { error: linkError } = await supabase.from("tenant_users").insert({
        tenant_id: selectedTenant?.id,
        email,
        role
      })
      if (linkError) throw linkError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users", selectedTenant?.id] })
      setUserForm({ email: "", password: "", role: "user" })
      toast.success("Usuário criado!")
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar usuário")
  })

  const resetForm = () => {
    setEditing(null)
    setForm({ name: "", slug: "", max_sessions: 2, primary_color: "#16a34a", active: true })
  }

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant)
    setForm({
      name: tenant.name,
      slug: tenant.slug,
      max_sessions: tenant.max_sessions,
      primary_color: tenant.primary_color || "#16a34a",
      active: tenant.active
    })
    setOpen(true)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateTenantMutation.mutate({ ...editing, ...form })
    } else {
      createTenantMutation.mutate(form as TenantInsert)
    }
  }

  return (
    <div className="space-y-6">
      <pre className="p-4 bg-yellow-100 text-sm">
        DEBUG: user={user ? "logged" : "null"} | tenants count={tenants?.length || 0} | error={error?.message || "none"}
      </pre>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro ao carregar: {error.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Clientes / Lojas</h1>
          <p className="text-slate-600">Gerencie os clientes do sistema</p>
        </div>
        <button onClick={() => console.log("open set to true")} className="bg-slate-800 text-white px-4 py-2 rounded">
          <Plus className="w-4 h-4 mr-2 inline" /> Novo Cliente (TEST)
        </button>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Limite de Acessos</Label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={form.max_sessions}
                  onChange={(e) => setForm({ ...form, max_sessions: parseInt(e.target.value) || 2 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor Principal</Label>
                <div className="flex gap-3">
                  <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-16 h-12" />
                  <Input type="text" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createTenantMutation.isPending || updateTenantMutation.isPending}>
                {editing ? "Salvar" : "Criar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : tenants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">Nenhum cliente encontrado</p>
          <Button onClick={() => { console.log("tenants:", tenants); console.log("open:", open); }} className="bg-slate-800">
            Debug
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: tenant.primary_color || "#16a34a" }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                      <p className="text-sm text-slate-500">/{tenant.slug}</p>
                    </div>
                  </div>
                  <Badge variant={tenant.active ? "default" : "destructive"}>
                    {tenant.active ? "Ativo" : "Bloqueado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Máx. acessos:</span>
                  <span className="font-semibold">{tenant.max_sessions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Cor:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: tenant.primary_color }} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setShowUsers(true)
                    }}
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-1" /> Usuários
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(tenant)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate({ id: tenant.id, active: !tenant.active })}
                  >
                    {tenant.active ? "Bloquear" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Usuários - {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    createUserMutation.mutate(userForm)
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Senha"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                    />
                    <Button type="submit" size="sm" disabled={createUserMutation.isPending}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {tenantUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-slate-500">{user.role}</p>
                  </div>
                  <Badge variant={user.active ? "default" : "destructive"}>{user.active ? "Ativo" : "Inativo"}</Badge>
                </div>
              ))}
              {!tenantUsers.length && <p className="text-center text-slate-500 py-4">Nenhum usuário cadastrado</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminTenants