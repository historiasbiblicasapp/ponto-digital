import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Plus, Pencil, Search } from "lucide-react"
import type { Funcionario, Filial } from "@/integrations/supabase/ponto-digital"
import { TIPOS_JORNADA } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, GRID, TEXT, FLEX, TABLE, DIALOG, BUTTON, PAGE_PADDING, HIDE } from "@/lib/design-system"

const AdminEmployees = () => {
  const { company, user } = useAuth()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Funcionario | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    matricula: "",
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cargo: "",
    setor: "",
    filial_id: "",
    pin: "",
    tipo_jornada: "fixa",
    carga_horaria_semanal: 44,
    horas_diaria: 8,
    tolerancia_minutos: 10,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (company?.id) {
      carregarDados()
    }
  }, [company])

  const carregarDados = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const [funcRes, filialRes] = await Promise.all([
        supabase
          .from("funcionarios")
          .select("*")
          .eq("empresa_id", company.id)
          .order("nome"),
        supabase
          .from("filiais")
          .select("*")
          .eq("empresa_id", company.id)
          .eq("ativo", true),
      ])

      if (funcRes.error) throw funcRes.error
      if (filialRes.error) throw filialRes.error

      setFuncionarios(funcRes.data || [])
      setFiliais(filialRes.data || [])
    } catch (err: any) {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!company?.id) return
    if (!form.matricula || !form.nome) {
      toast.error("Matrícula e nome são obrigatórios")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        empresa_id: company.id,
        matricula: form.matricula,
        nome: form.nome,
        cpf: form.cpf || null,
        email: form.email || null,
        telefone: form.telefone || null,
        cargo: form.cargo || null,
        setor: form.setor || null,
        filial_id: form.filial_id || null,
        pin: form.pin || null,
        tipo_jornada: form.tipo_jornada,
        carga_horaria_semanal: form.carga_horaria_semanal,
        horas_diaria: form.horas_diaria,
        tolerancia_minutos: form.tolerancia_minutos,
      }

      if (editing) {
        const { error } = await supabase
          .from("funcionarios")
          .update(payload)
          .eq("id", editing.id)

        if (error) throw error
        toast.success("Funcionário atualizado!")
      } else {
        const { error } = await supabase
          .from("funcionarios")
          .insert(payload)

        if (error) throw error
        toast.success("Funcionário cadastrado!")
      }

      setDialogOpen(false)
      resetForm()
      carregarDados()
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      matricula: "", nome: "", cpf: "", email: "", telefone: "",
      cargo: "", setor: "", filial_id: "", pin: "", tipo_jornada: "fixa",
      carga_horaria_semanal: 44, horas_diaria: 8, tolerancia_minutos: 10,
    })
  }

  const handleEdit = (f: Funcionario) => {
    setEditing(f)
    setForm({
      matricula: f.matricula,
      nome: f.nome,
      cpf: f.cpf || "",
      email: f.email || "",
      telefone: f.telefone || "",
      cargo: f.cargo || "",
      setor: f.setor || "",
      filial_id: f.filial_id || "",
      pin: f.pin || "",
      tipo_jornada: f.tipo_jornada,
      carga_horaria_semanal: f.carga_horaria_semanal,
      horas_diaria: f.horas_diaria,
      tolerancia_minutos: f.tolerancia_minutos,
    })
    setDialogOpen(true)
  }

  const handleToggleActive = async (f: Funcionario) => {
    try {
      const { error } = await supabase
        .from("funcionarios")
        .update({ ativo: !f.ativo })
        .eq("id", f.id)

      if (error) throw error
      toast.success(f.ativo ? "Funcionário desativado" : "Funcionário ativado")
      carregarDados()
    } catch (err: any) {
      toast.error("Erro ao alterar status")
    }
  }

  const filtered = funcionarios.filter(f =>
    !search || f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.matricula.toLowerCase().includes(search.toLowerCase()) ||
    f.cpf?.includes(search)
  )

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div>
          <h1 className={TEXT.pageTitle}>Funcionários</h1>
          <p className={TEXT.body}>{funcionarios.length} cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) resetForm()
          setDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button className={BUTTON.primary}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className={DIALOG.content}>
            <DialogHeader className={DIALOG.header}>
              <DialogTitle>{editing ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
            </DialogHeader>
            <div className={GRID.form2}>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Matrícula *</Label>
                <Input
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  placeholder="001"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Auxiliar"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Setor</Label>
                <Input
                  value={form.setor}
                  onChange={(e) => setForm({ ...form, setor: e.target.value })}
                  placeholder="Produção"
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Filial</Label>
                <Select
                  value={form.filial_id}
                  onValueChange={(v) => setForm({ ...form, filial_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem filial</SelectItem>
                    {filiais.map((fil) => (
                      <SelectItem key={fil.id} value={fil.id}>{fil.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>PIN (Kiosk)</Label>
                <Input
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder="1234"
                  maxLength={6}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Tipo de Jornada</Label>
                <Select
                  value={form.tipo_jornada}
                  onValueChange={(v) => setForm({ ...form, tipo_jornada: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_JORNADA.map((tj) => (
                      <SelectItem key={tj.value} value={tj.value}>{tj.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Carga Semanal (h)</Label>
                <Input
                  type="number"
                  value={form.carga_horaria_semanal}
                  onChange={(e) => setForm({ ...form, carga_horaria_semanal: Number(e.target.value) })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Horas Diária</Label>
                <Input
                  type="number"
                  value={form.horas_diaria}
                  onChange={(e) => setForm({ ...form, horas_diaria: Number(e.target.value) })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Tolerância (min)</Label>
                <Input
                  type="number"
                  value={form.tolerancia_minutos}
                  onChange={(e) => setForm({ ...form, tolerancia_minutos: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : editing ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, matrícula ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className={CARD_PADDING.table}>
        <div className={TABLE.wrapper}>
          <table className={TABLE.table}>
            <thead>
              <tr className="border-b">
                <th className={TABLE.th}>Matrícula</th>
                <th className={TABLE.th}>Nome</th>
                <th className={TABLE.th}>Cargo</th>
                <th className={TABLE.th}>Setor</th>
                <th className={TABLE.th}>Jornada</th>
                <th className={TABLE.th}>Status</th>
                <th className={`${TABLE.th} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className={`border-b last:border-0 hover:bg-muted/50 ${TABLE.row}`}>
                  <td className={TABLE.td} data-label="Matrícula"><span className={TEXT.mono}>{f.matricula}</span></td>
                  <td className={TABLE.td} data-label="Nome"><span className="font-medium">{f.nome}</span></td>
                  <td className={TABLE.td} data-label="Cargo"><span className={TEXT.small}>{f.cargo || '-'}</span></td>
                  <td className={TABLE.td} data-label="Setor"><span className={TEXT.small}>{f.setor || '-'}</span></td>
                  <td className={TABLE.td} data-label="Jornada"><span className={TEXT.body}>{f.tipo_jornada}</span></td>
                  <td className={TABLE.td} data-label="Status">
                    <Badge
                      variant="outline"
                      className={f.ativo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                    >
                      {f.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className={`${TABLE.td} ds-td-label text-right`}>
                    <div className={FLEX.end}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(f)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(f)}
                        className="text-xs"
                      >
                        {f.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum funcionário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminEmployees
