import { useState } from "react"
import { useFerias } from "@/contexts/FeriasContext"
import { GlassCard, StatCard, AnimatedCounter } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Calendar, Send, Ban, Umbrella, Clock, CheckCircle, XCircle } from "lucide-react"
import { STACK, CARD_PADDING, GRID, TEXT, FLEX } from "@/lib/design-system"

const statusBadge: Record<string, { label: string; class: string }> = {
  agendada: { label: "Agendada", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  concedida: { label: "Concedida", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  cancelada: { label: "Cancelada", class: "bg-red-500/10 text-red-400 border-red-500/20" },
}

export default function EmployeeFerias() {
  const { ferias, saldo, loading, solicitarFerias, cancelarFerias, refresh } = useFerias()
  const [aba, setAba] = useState<"solicitar" | "historico">("solicitar")
  const [form, setForm] = useState({ data_inicio: "", data_fim: "", dias: 0, observacao: "" })
  const [submitting, setSubmitting] = useState(false)

  const calcularDias = (inicio: string, fim: string) => {
    if (!inicio || !fim) return 0
    const diff = new Date(fim).getTime() - new Date(inicio).getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
  }

  const handleSubmit = async () => {
    if (!form.data_inicio || !form.data_fim || form.dias < 1) {
      toast.error("Preencha todos os campos")
      return
    }
    if (saldo && form.dias > saldo.saldo) {
      toast.error("Dias solicitados excedem o saldo disponível")
      return
    }
    setSubmitting(true)
    try {
      await solicitarFerias({
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        dias: form.dias,
        observacao: form.observacao || undefined,
      })
      toast.success("Solicitação de férias enviada!")
      setForm({ data_inicio: "", data_fim: "", dias: 0, observacao: "" })
      setAba("historico")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = async (id: string) => {
    try {
      await cancelarFerias(id)
      toast.success("Férias canceladas")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className={STACK.page}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Umbrella className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className={TEXT.pageTitle}>Férias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas solicitações de férias</p>
        </div>
      </div>

      {saldo && (
        <div className={GRID.stat3 + " mb-6"}>
          <GlassCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Direito</p>
            <p className="text-2xl font-bold text-blue-400"><AnimatedCounter value={saldo.dias_direito} /></p>
            <p className="text-xs text-muted-foreground">dias</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Utilizados/Agendados</p>
            <p className="text-2xl font-bold text-amber-400"><AnimatedCounter value={saldo.dias_utilizados + saldo.dias_agendados} /></p>
            <p className="text-xs text-muted-foreground">dias</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
            <p className="text-2xl font-bold text-green-400"><AnimatedCounter value={saldo.saldo} /></p>
            <p className="text-xs text-muted-foreground">dias</p>
          </GlassCard>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <Button variant={aba === "solicitar" ? "default" : "outline"} onClick={() => setAba("solicitar")} size="sm">
          <Calendar className="w-4 h-4 mr-2" />Solicitar
        </Button>
        <Button variant={aba === "historico" ? "default" : "outline"} onClick={() => setAba("historico")} size="sm">
          <Clock className="w-4 h-4 mr-2" />Histórico
        </Button>
      </div>

      {aba === "solicitar" && (
        <GlassCard className="p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Nova Solicitação de Férias</h2>
          <div className={STACK.form}>
            <div>
              <label className={TEXT.label}>Data Início</label>
              <Input type="date" value={form.data_inicio} onChange={e => {
                const val = e.target.value
                setForm(prev => ({ ...prev, data_inicio: val, dias: calcularDias(val, prev.data_fim) }))
              }} />
            </div>
            <div>
              <label className={TEXT.label}>Data Fim</label>
              <Input type="date" value={form.data_fim} onChange={e => {
                const val = e.target.value
                setForm(prev => ({ ...prev, data_fim: val, dias: calcularDias(prev.data_inicio, val) }))
              }} />
            </div>
            <div>
              <label className={TEXT.label}>Dias</label>
              <p className="text-2xl font-bold">{form.dias}</p>
            </div>
            <div>
              <label className={TEXT.label}>Observação (opcional)</label>
              <Textarea value={form.observacao} onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))} placeholder="Motivo da solicitação..." />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || form.dias < 1} className="w-full">
              <Send className="w-4 h-4 mr-2" />{submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </GlassCard>
      )}

      {aba === "historico" && (
        <div className={STACK.tight}>
          {ferias.length === 0 && !loading && (
            <GlassCard className="p-8 text-center text-muted-foreground">
              <Umbrella className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nenhuma solicitação de férias encontrada</p>
            </GlassCard>
          )}
          {ferias.map(f => (
            <GlassCard key={f.id} className="p-4">
              <div className={FLEX.between}>
                <div>
                  <p className="font-semibold">{new Date(f.data_inicio).toLocaleDateString("pt-BR")} a {new Date(f.data_fim).toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm text-muted-foreground">{f.dias} dias {f.observacao ? `- ${f.observacao}` : ""}</p>
                </div>
                <div className={FLEX.end + " gap-2"}>
                  <Badge variant="outline" className={statusBadge[f.status]?.class || ""}>
                    {statusBadge[f.status]?.label || f.status}
                  </Badge>
                  {f.status === "agendada" && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancelar(f.id)}>
                      <Ban className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
