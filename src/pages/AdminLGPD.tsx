import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Shield, Search, CheckCircle2, XCircle, Clock, UserCheck,
  Download, Trash2, Eye, FileEdit, AlertTriangle
} from "lucide-react"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID } from "@/lib/design-system"

interface Solicitacao {
  id: string
  empresa_id: string
  funcionario_id: string | null
  auth_user_id: string | null
  tipo: "exclusao" | "correcao" | "exportacao" | "acesso" | "revogacao_consentimento"
  descricao: string | null
  dados_solicitados: any
  status: "pendente" | "processando" | "concluido" | "recusado"
  resposta: string | null
  data_conclusao: string | null
  created_at: string
  updated_at: string
  funcionario?: { nome: string; matricula: string; email: string; cargo: string; setor: string } | null
}

const TIPO_LABEL: Record<string, string> = {
  exclusao: "Exclusão de Dados",
  correcao: "Correção de Dados",
  exportacao: "Exportação de Dados",
  acesso: "Acesso aos Dados",
  revogacao_consentimento: "Revogação de Consentimento",
}

const TIPO_ICON: Record<string, any> = {
  exclusao: Trash2,
  correcao: FileEdit,
  exportacao: Download,
  acesso: Eye,
  revogacao_consentimento: AlertTriangle,
}

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700 border-amber-300",
  processando: "bg-blue-100 text-blue-700 border-blue-300",
  concluido: "bg-green-100 text-green-700 border-green-300",
  recusado: "bg-red-100 text-red-700 border-red-300",
}

const AdminLGPD = () => {
  const { company } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todas")
  const [filtroStatus, setFiltroStatus] = useState("pendente")
  const [selected, setSelected] = useState<Solicitacao | null>(null)
  const [resposta, setResposta] = useState("")
  const [processando, setProcessando] = useState(false)

  const carregar = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      let query = supabase
        .from("lgpd_solicitacoes")
        .select("*, funcionario:funcionario_id(nome, matricula, email, cargo, setor)")
        .eq("empresa_id", company.id)

      if (filtroTipo !== "todas") query = query.eq("tipo", filtroTipo)
      if (filtroStatus === "pendente") query = query.in("status", ["pendente", "processando"])
      else if (filtroStatus !== "todas") query = query.eq("status", filtroStatus)

      query = query.order("created_at", { ascending: false }).limit(50)

      const { data } = await query
      setSolicitacoes((data as Solicitacao[]) || [])
    } catch (err) {
      console.error("[AdminLGPD]", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [company, filtroTipo, filtroStatus])

  const processar = async (id: string, novoStatus: "concluido" | "recusado") => {
    if (!resposta.trim()) {
      toast.error("Escreva uma resposta para o solicitante")
      return
    }
    setProcessando(true)
    try {
      const { error } = await supabase
        .from("lgpd_solicitacoes")
        .update({
          status: novoStatus,
          resposta,
          data_conclusao: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error
      toast.success(`Solicitação ${novoStatus === "concluido" ? "aprovada" : "recusada"}!`)
      setSelected(null)
      setResposta("")
      carregar()
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar")
    } finally {
      setProcessando(false)
    }
  }

  const filtered = solicitacoes.filter(s =>
    s.funcionario?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    s.funcionario?.matricula?.includes(search) ||
    s.descricao?.toLowerCase().includes(search.toLowerCase())
  )

  const pendentes = solicitacoes.filter(s => s.status === "pendente").length

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div className={FLEX.center}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className={TEXT.pageTitle}>LGPD - Solicitações</h1>
            <p className={TEXT.body}>Gerencie solicitações de direitos dos titulares</p>
          </div>
        </div>
        <Badge className="text-base px-4 py-1.5" variant={pendentes > 0 ? "default" : "outline"}>
          {pendentes} pendente{pendentes !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Stats */}
      <div className={GRID.stat4}>
        <Card className={CARD_PADDING.compact}>
          <p className={TEXT.small}>Total</p>
          <p className={TEXT.kpi}>{solicitacoes.length}</p>
        </Card>
        <Card className={CARD_PADDING.compact}>
          <p className={TEXT.small}>Pendentes</p>
          <p className={TEXT.kpi + " text-amber-500"}>{pendentes}</p>
        </Card>
        <Card className={CARD_PADDING.compact}>
          <p className={TEXT.small}>Concluídos</p>
          <p className={TEXT.kpi + " text-green-500"}>{solicitacoes.filter(s => s.status === "concluido").length}</p>
        </Card>
        <Card className={CARD_PADDING.compact}>
          <p className={TEXT.small}>Recusados</p>
          <p className={TEXT.kpi + " text-red-500"}>{solicitacoes.filter(s => s.status === "recusado").length}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className={GRID.filters}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os tipos</SelectItem>
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendentes (+ em andamento)</SelectItem>
            <SelectItem value="concluido">Concluídos</SelectItem>
            <SelectItem value="recusado">Recusados</SelectItem>
            <SelectItem value="todas">Todos os status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className={CARD_PADDING.standard}>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className={TEXT.body}>Nenhuma solicitação encontrada</p>
          </div>
        ) : (
          <div className={STACK.section}>
            {filtered.map((s) => {
              const Icon = TIPO_ICON[s.tipo] || Shield
              return (
                <div key={s.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => { setSelected(s); setResposta(s.resposta || "") }}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={FLEX.betweenNowrap}>
                      <p className="font-medium text-sm truncate">
                        {TIPO_LABEL[s.tipo] || s.tipo}
                      </p>
                      <Badge variant="outline" className={STATUS_BADGE[s.status]}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className={TEXT.small + " truncate"}>
                      {s.funcionario?.nome || "Funcionário não identificado"}
                      {s.funcionario?.matricula && ` • ${s.funcionario.matricula}`}
                    </p>
                    {s.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.descricao}</p>
                    )}
                    <p className={TEXT.small + " mt-1"}>
                      {new Date(s.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setResposta("") } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{TIPO_LABEL[selected.tipo] || selected.tipo}</DialogTitle>
                <DialogDescription>
                  Solicitado em {new Date(selected.created_at).toLocaleString("pt-BR")}
                </DialogDescription>
              </DialogHeader>
              <div className={STACK.section}>
                <div className={GRID.form2}>
                  <div>
                    <p className={TEXT.label}>Funcionário</p>
                    <p className="text-sm font-medium">{selected.funcionario?.nome || "-"}</p>
                  </div>
                  <div>
                    <p className={TEXT.label}>Matrícula</p>
                    <p className="text-sm font-medium">{selected.funcionario?.matricula || "-"}</p>
                  </div>
                  <div>
                    <p className={TEXT.label}>Cargo</p>
                    <p className="text-sm">{selected.funcionario?.cargo || "-"}</p>
                  </div>
                  <div>
                    <p className={TEXT.label}>Setor</p>
                    <p className="text-sm">{selected.funcionario?.setor || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className={TEXT.label}>Status</p>
                  <Badge variant="outline" className={STATUS_BADGE[selected.status]}>{selected.status}</Badge>
                </div>
                {selected.descricao && (
                  <div>
                    <p className={TEXT.label}>Descrição / Motivo</p>
                    <div className="p-3 bg-muted rounded-lg text-sm mt-1 whitespace-pre-wrap">{selected.descricao}</div>
                  </div>
                )}
                {selected.resposta && (
                  <div>
                    <p className={TEXT.label}>Resposta</p>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm mt-1 whitespace-pre-wrap">{selected.resposta}</div>
                  </div>
                )}
                {selected.data_conclusao && (
                  <div>
                    <p className={TEXT.label}>Concluído em</p>
                    <p className="text-sm">{new Date(selected.data_conclusao).toLocaleString("pt-BR")}</p>
                  </div>
                )}
                {selected.status === "pendente" || selected.status === "processando" ? (
                  <div className={STACK.tight}>
                    <Label className={TEXT.label}>Sua resposta</Label>
                    <Textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      placeholder="Escreva uma resposta para o solicitante..."
                      rows={3}
                    />
                    <div className={FLEX.end + " gap-2"}>
                      <Button variant="destructive" onClick={() => processar(selected.id, "recusado")} disabled={processando}>
                        <XCircle className="w-4 h-4" /> Recusar
                      </Button>
                      <Button onClick={() => processar(selected.id, "concluido")} disabled={processando}>
                        <CheckCircle2 className="w-4 h-4" /> Aprovar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminLGPD
