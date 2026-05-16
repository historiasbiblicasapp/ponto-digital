import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle, XCircle, Umbrella, Search } from "lucide-react"
import { STACK, GRID, TEXT, FLEX } from "@/lib/design-system"
import type { Ferias } from "@/integrations/supabase/ponto-digital"
import { Input } from "@/components/ui/input"

interface FeriasComFunc extends Ferias {
  funcionarios?: { nome: string; matricula: string }
}

const statusBadge: Record<string, { label: string; class: string }> = {
  agendada: { label: "Aguardando", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  concedida: { label: "Concedida", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  cancelada: { label: "Cancelada", class: "bg-red-500/10 text-red-400 border-red-500/20" },
}

export default function AdminFerias() {
  const { company, user } = useAuth()
  const [ferias, setFerias] = useState<FeriasComFunc[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todas" | "agendada" | "concedida" | "cancelada">("todas")
  const [busca, setBusca] = useState("")

  const carregar = async () => {
    if (!company?.id) return
    setLoading(true)
    const { data } = await supabase
      .from("ferias")
      .select("*, funcionarios!inner(nome, matricula)")
      .eq("empresa_id", company.id)
      .order("created_at", { ascending: false })
    if (data) setFerias(data)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [company])

  const handleAprovar = async (id: string, observacao?: string) => {
    if (!user?.funcionario) { toast.error("Funcionário admin não encontrado"); return }
    const { error } = await supabase
      .from("ferias")
      .update({ status: "concedida", aprovado_por: user.funcionario.id, observacao: observacao || null })
      .eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success("Férias aprovadas!")
    await carregar()
  }

  const handleRecusar = async (id: string, observacao?: string) => {
    const { error } = await supabase
      .from("ferias")
      .update({ status: "cancelada", observacao: observacao || null })
      .eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success("Férias recusadas")
    await carregar()
  }

  const diasFiltrados = ferias.filter(f => {
    if (filtro !== "todas" && f.status !== filtro) return false
    if (busca && !f.funcionarios?.nome.toLowerCase().includes(busca.toLowerCase()) && !f.funcionarios?.matricula.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <div className={STACK.page}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Umbrella className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className={TEXT.pageTitle}>Gerenciar Férias</h1>
          <p className="text-sm text-muted-foreground">Aprove ou recuse solicitações de férias</p>
        </div>
      </div>

      <div className={FLEX.row + " mb-4"}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar funcionário..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className={FLEX.row}>
          {(["todas", "agendada", "concedida", "cancelada"] as const).map(f => (
            <Button key={f} variant={filtro === f ? "default" : "outline"} size="sm" onClick={() => setFiltro(f)}>
              {f === "todas" ? "Todas" : statusBadge[f].label}
            </Button>
          ))}
        </div>
      </div>

      <div className={STACK.tight}>
        {diasFiltrados.length === 0 && !loading && (
          <GlassCard className="p-8 text-center text-muted-foreground">
            <Umbrella className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma solicitação encontrada</p>
          </GlassCard>
        )}
        {diasFiltrados.map(f => (
          <GlassCard key={f.id} className="p-4">
            <div className={FLEX.between + " mb-2"}>
              <div>
                <p className="font-semibold">{f.funcionarios?.nome} <span className="text-muted-foreground font-normal">({f.funcionarios?.matricula})</span></p>
                <p className="text-sm text-muted-foreground">
                  {new Date(f.data_inicio).toLocaleDateString("pt-BR")} a {new Date(f.data_fim).toLocaleDateString("pt-BR")} — {f.dias} dias
                </p>
                {f.observacao && <p className="text-xs text-muted-foreground mt-1 italic">"{f.observacao}"</p>}
              </div>
              <span className="shrink-0"><Badge variant="outline" className={statusBadge[f.status]?.class}>{statusBadge[f.status]?.label || f.status}</Badge></span>
            </div>
            {f.status === "agendada" && (
              <div className={FLEX.row + " gap-2"}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAprovar(f.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" />Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleRecusar(f.id)}>
                  <XCircle className="w-4 h-4 mr-1" />Recusar
                </Button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
