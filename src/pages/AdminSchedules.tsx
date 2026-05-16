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
import { Plus, Pencil, Clock, Calendar, Users, Trash2 } from "lucide-react"
import type { Escala, Funcionario } from "@/integrations/supabase/ponto-digital"
import { TIPOS_ESCALA } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, GRID, TEXT, FLEX, DIALOG, BUTTON } from "@/lib/design-system"

const AdminSchedules = () => {
  const { company } = useAuth()
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Escala | null>(null)
  const [form, setForm] = useState({
    nome: "",
    tipo: "5x2",
    hora_entrada: "08:00",
    hora_saida_almoco: "12:00",
    hora_retorno_almoco: "13:00",
    hora_saida: "18:00",
    tolerancia_minutos: 10,
    carga_horaria_diaria: 8,
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
      const [escalasRes, funcRes] = await Promise.all([
        supabase.from("escalas").select("*").eq("empresa_id", company.id).order("nome"),
        supabase.from("funcionarios").select("*").eq("empresa_id", company.id).eq("ativo", true),
      ])

      if (escalasRes.error) throw escalasRes.error
      setEscalas(escalasRes.data || [])
      if (funcRes.data) setFuncionarios(funcRes.data)
    } catch (err: any) {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!company?.id) return
    if (!form.nome) {
      toast.error("Nome da escala é obrigatório")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        empresa_id: company.id,
        nome: form.nome,
        tipo: form.tipo,
        hora_entrada: form.hora_entrada,
        hora_saida_almoco: form.hora_saida_almoco || null,
        hora_retorno_almoco: form.hora_retorno_almoco || null,
        hora_saida: form.hora_saida,
        tolerancia_minutos: form.tolerancia_minutos,
        carga_horaria_diaria: form.carga_horaria_diaria,
      }

      if (editing) {
        const { error } = await supabase.from("escalas").update(payload).eq("id", editing.id)
        if (error) throw error
        toast.success("Escala atualizada!")
      } else {
        const { error } = await supabase.from("escalas").insert(payload)
        if (error) throw error
        toast.success("Escala criada!")
      }

      setDialogOpen(false)
      setEditing(null)
      carregarDados()
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (e: Escala) => {
    setEditing(e)
    setForm({
      nome: e.nome,
      tipo: e.tipo,
      hora_entrada: e.hora_entrada.slice(0, 5),
      hora_saida_almoco: e.hora_saida_almoco?.slice(0, 5) || "12:00",
      hora_retorno_almoco: e.hora_retorno_almoco?.slice(0, 5) || "13:00",
      hora_saida: e.hora_saida.slice(0, 5),
      tolerancia_minutos: e.tolerancia_minutos,
      carga_horaria_diaria: e.carga_horaria_diaria,
    })
    setDialogOpen(true)
  }

  const getFuncionariosNaEscala = (escalaId: string) => {
    return funcionarios.filter(f => {
      return true
    }).length
  }

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div>
          <h1 className={TEXT.pageTitle}>Escalas</h1>
          <p className={TEXT.body}>Gerencie turnos e jornadas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) { setEditing(null) }
          setDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button className={BUTTON.primary}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Escala
            </Button>
          </DialogTrigger>
          <DialogContent className={DIALOG.content}>
            <DialogHeader className={DIALOG.header}>
              <DialogTitle>{editing ? "Editar Escala" : "Nova Escala"}</DialogTitle>
            </DialogHeader>
            <div className={GRID.form2}>
              <div className="col-span-1 sm:col-span-2">
                <div className={STACK.tight}>
                  <Label className={TEXT.label}>Nome da Escala</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Administrativo"
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <div className={STACK.tight}>
                  <Label className={TEXT.label}>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ESCALA.map((te) => (
                        <SelectItem key={te.value} value={te.value}>{te.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Entrada</Label>
                <Input
                  type="time"
                  value={form.hora_entrada}
                  onChange={(e) => setForm({ ...form, hora_entrada: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Saída Almoço</Label>
                <Input
                  type="time"
                  value={form.hora_saida_almoco}
                  onChange={(e) => setForm({ ...form, hora_saida_almoco: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Retorno Almoço</Label>
                <Input
                  type="time"
                  value={form.hora_retorno_almoco}
                  onChange={(e) => setForm({ ...form, hora_retorno_almoco: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Saída</Label>
                <Input
                  type="time"
                  value={form.hora_saida}
                  onChange={(e) => setForm({ ...form, hora_saida: e.target.value })}
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
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Carga Diária (h)</Label>
                <Input
                  type="number"
                  value={form.carga_horaria_diaria}
                  onChange={(e) => setForm({ ...form, carga_horaria_diaria: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : editing ? "Atualizar" : "Criar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className={GRID.cards3}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className={CARD_PADDING.standard}>
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : escalas.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center text-muted-foreground">
          <Calendar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-base sm:text-lg">Nenhuma escala cadastrada</p>
          <p className={TEXT.body + " mt-2"}>Crie escalas para definir turnos e jornadas</p>
        </Card>
      ) : (
        <div className={GRID.cards3}>
          {escalas.map((e) => (
            <Card key={e.id} className={CARD_PADDING.standard}>
              <div className={FLEX.betweenNowrap + " mb-4"}>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{e.nome}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {TIPOS_ESCALA.find(te => te.value === e.tipo)?.label || e.tipo}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => handleEdit(e)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>

              <div className={STACK.tight + " text-xs sm:text-sm"}>
                <div className={FLEX.betweenNowrap}>
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="font-mono font-bold">{e.hora_entrada.slice(0, 5)}</span>
                </div>
                {e.hora_saida_almoco && (
                  <div className={FLEX.betweenNowrap}>
                    <span className="text-muted-foreground">Saída Almoço</span>
                    <span className="font-mono font-bold">{e.hora_saida_almoco.slice(0, 5)}</span>
                  </div>
                )}
                {e.hora_retorno_almoco && (
                  <div className={FLEX.betweenNowrap}>
                    <span className="text-muted-foreground">Retorno Almoço</span>
                    <span className="font-mono font-bold">{e.hora_retorno_almoco.slice(0, 5)}</span>
                  </div>
                )}
                <div className={FLEX.betweenNowrap}>
                  <span className="text-muted-foreground">Saída</span>
                  <span className="font-mono font-bold">{e.hora_saida.slice(0, 5)}</span>
                </div>
                <div className="border-t border-glass-border pt-2 mt-2">
                  <div className={FLEX.betweenNowrap}>
                    <span className="text-muted-foreground">Carga Diária</span>
                    <span className="font-bold">{e.carga_horaria_diaria}h</span>
                  </div>
                  <div className={FLEX.betweenNowrap}>
                    <span className="text-muted-foreground">Tolerância</span>
                    <span>{e.tolerancia_minutos}min</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminSchedules
