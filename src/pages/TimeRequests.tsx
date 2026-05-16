import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import type { Ajuste } from "@/integrations/supabase/ponto-digital"
import { TIPOS_AJUSTE } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, TEXT, FLEX, DIALOG } from "@/lib/design-system"

const TimeRequests = () => {
  const { user, company } = useAuth()
  const [ajustes, setAjustes] = useState<Ajuste[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    tipo: "",
    data_referencia: new Date().toISOString().split('T')[0],
    justificativa: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.funcionario?.id) {
      carregarAjustes()
    }
  }, [user])

  const carregarAjustes = async () => {
    if (!user?.funcionario?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("ajustes")
        .select("*")
        .eq("funcionario_id", user.funcionario.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAjustes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.funcionario?.id || !company?.id) return
    if (!form.tipo || !form.justificativa) {
      toast.error("Preencha todos os campos")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("ajustes").insert({
        funcionario_id: user.funcionario.id,
        empresa_id: company.id,
        tipo: form.tipo,
        data_referencia: form.data_referencia,
        justificativa: form.justificativa,
        status: "pendente",
      })

      if (error) throw error

      toast.success("Solicitação enviada com sucesso!")
      setDialogOpen(false)
      setForm({ tipo: "", data_referencia: new Date().toISOString().split('T')[0], justificativa: "" })
      carregarAjustes()
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>
      case 'recusado':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
    }
  }

  const tipoLabel = (tipo: string) => {
    const t = TIPOS_AJUSTE.find(a => a.value === tipo)
    return t?.label || tipo
  }

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div>
          <h1 className={TEXT.pageTitle}>Solicitações</h1>
          <p className={TEXT.body}>Ajustes de ponto e justificativas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className={DIALOG.content}>
            <DialogHeader className={DIALOG.header}>
              <DialogTitle>Nova Solicitação</DialogTitle>
            </DialogHeader>
            <div className={STACK.form}>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_AJUSTE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Data de Referência</Label>
                <Input
                  type="date"
                  value={form.data_referencia}
                  onChange={(e) => setForm({ ...form, data_referencia: e.target.value })}
                />
              </div>
              <div className={STACK.tight}>
                <Label className={TEXT.label}>Justificativa</Label>
                <Textarea
                  placeholder="Descreva o motivo da solicitação..."
                  value={form.justificativa}
                  onChange={(e) => setForm({ ...form, justificativa: e.target.value })}
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className={STACK.tight}>
          {[1, 2].map(i => (
            <Card key={i} className={CARD_PADDING.standard}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : ajustes.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center text-muted-foreground">
          <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-base sm:text-lg">Nenhuma solicitação encontrada</p>
          <p className={TEXT.body + " mt-2"}>Clique em "Nova Solicitação" para criar</p>
        </Card>
      ) : (
        <div className={STACK.tight}>
          {ajustes.map((a) => (
            <Card key={a.id} className={CARD_PADDING.standard}>
              <div className={FLEX.start}>
                <div className={STACK.tight + " min-w-0 flex-1"}>
                  <div className={FLEX.center + " flex-wrap"}>
                    <span className="font-semibold text-sm sm:text-base">{tipoLabel(a.tipo)}</span>
                    {statusBadge(a.status)}
                  </div>
                  <p className={TEXT.body}>
                    Data: {new Date(a.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className={TEXT.body + " mt-2"}>{a.justificativa}</p>
                  {a.observacao_rh && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm">
                      <span className="font-medium">RH: </span>
                      {a.observacao_rh}
                    </div>
                  )}
                </div>
                <p className={TEXT.small + " shrink-0"}>
                  {new Date(a.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimeRequests
