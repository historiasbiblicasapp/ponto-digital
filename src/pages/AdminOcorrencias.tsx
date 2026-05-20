import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  AlertTriangle, Clock, UserX, UserCheck, Coffee, ArrowLeftRight,
  Search, Filter, CheckCircle, XCircle, ChevronDown, ChevronRight,
  ShieldAlert, Calendar, RefreshCw
} from "lucide-react"
import type { Funcionario, RegistroPonto } from "@/integrations/supabase/ponto-digital"
import type { Database } from "@/integrations/supabase/types"

type Escala = Database["public"]["Tables"]["escalas"]["Row"]
type FuncionarioEscala = Database["public"]["Tables"]["funcionario_escala"]["Row"]

interface Ocorrencia {
  id: string
  funcionario_id: string
  funcionario_nome: string
  funcionario_matricula: string
  funcionario_cargo: string | null
  data: string
  tipo: "falta" | "atraso" | "saida_pendente" | "saida_antecipada" | "almoco_incompleto"
  descricao: string
  hora_esperada: string | null
  hora_registrada: string | null
  tolerancia: number
  escala_nome: string | null
  registro_ponto_id: string | null
  justificado: boolean
  justificativa_id: string | null
}

const TIPO_OCORRENCIA_LABEL: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  saida_pendente: "Saída Pendente",
  saida_antecipada: "Saída Antecipada",
  almoco_incompleto: "Almoço Incompleto",
}

const TIPO_OCORRENCIA_ICON: Record<string, any> = {
  falta: UserX,
  atraso: Clock,
  saida_pendente: ShieldAlert,
  saida_antecipada: ArrowLeftRight,
  almoco_incompleto: Coffee,
}

const COLORS = { green: "#00ff88", blue: "#00b4ff", amber: "#f59e0b", red: "#ff3366", purple: "#8b5cf6" }

export default function AdminOcorrencias() {
  const { company } = useAuth()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<(Funcionario & { escala?: Escala })[]>([])
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [funcionarioEscalas, setFuncionarioEscalas] = useState<FuncionarioEscala[]>([])
  const [registros, setRegistros] = useState<RegistroPonto[]>([])
  const [ajustes, setAjustes] = useState<any[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>("todas")
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>("todos")
  const [search, setSearch] = useState("")
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})

  // Dialog justificar
  const [justificarOpen, setJustificarOpen] = useState(false)
  const [justificarTarget, setJustificarTarget] = useState<Ocorrencia | null>(null)
  const [justificativaTexto, setJustificativaTexto] = useState("")

  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`
  const dataFim = new Date(ano, mes, 0).toISOString().split("T")[0]

  useEffect(() => {
    if (company?.id) carregarDados()
  }, [company, mes, ano])

  const carregarDados = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const [funcRes, escalaRes, feRes, regRes, ajusteRes] = await Promise.all([
        supabase.from("funcionarios").select("*").eq("empresa_id", company.id).eq("ativo", true),
        supabase.from("escalas").select("*").eq("empresa_id", company.id).eq("ativo", true),
        supabase.from("funcionario_escala").select("*"),
        supabase.from("registros_ponto").select("*").eq("empresa_id", company.id)
          .gte("data", dataInicio).lte("data", dataFim).order("data_hora"),
        supabase.from("ajustes").select("*").eq("empresa_id", company.id)
          .gte("data_referencia", dataInicio).lte("data_referencia", dataFim),
      ])

      const fmap = new Map((feRes.data || []).map(fe => [fe.funcionario_id, fe]))
      const escalaMap = new Map((escalaRes.data || []).map(e => [e.id, e]))

      const funcsComEscala = (funcRes.data || []).map(f => ({
        ...f,
        escala: escalaMap.get(fmap.get(f.id)?.escala_id || "") || undefined,
      }))

      setFuncionarios(funcsComEscala)
      setEscalas(escalaRes.data || [])
      setFuncionarioEscalas(feRes.data || [])
      setRegistros(regRes.data || [])
      setAjustes(ajusteRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const diasDoMes = useMemo(() => {
    const dias: string[] = []
    const d = new Date(ano, mes - 1, 1)
    while (d.getMonth() === mes - 1) {
      dias.push(d.toISOString().split("T")[0])
      d.setDate(d.getDate() + 1)
    }
    return dias
  }, [mes, ano])

  const ajustesPorFuncData = useMemo(() => {
    const map = new Map<string, Set<string>>()
    const justIds = new Map<string, string>()
    for (const a of ajustes) {
      if (a.status === "aprovado" || a.status === "pendente") {
        const key = `${a.funcionario_id}|${a.data_referencia}`
        if (!map.has(key)) map.set(key, new Set())
        map.get(key)!.add(a.tipo)
        justIds.set(key, a.id)
      }
    }
    return { tipos: map, ids: justIds }
  }, [ajustes])

  const ocorrencias = useMemo(() => {
    const result: Ocorrencia[] = []
    const regsPorFuncData = new Map<string, RegistroPonto[]>()
    for (const r of registros) {
      const key = `${r.funcionario_id}|${r.data}`
      if (!regsPorFuncData.has(key)) regsPorFuncData.set(key, [])
      regsPorFuncData.get(key)!.push(r)
    }

    for (const func of funcionarios) {
      const fe = funcionarioEscalas.find(fe => fe.funcionario_id === func.id && (fe.data_fim === null || fe.data_fim >= dataInicio))
      const escala = fe ? escalas.find(e => e.id === fe.escala_id) : undefined
      const tolerancia = func.tolerancia_minutos ?? escala?.tolerancia_minutos ?? 10

      for (const data of diasDoMes) {
        const diaSemana = new Date(data + "T12:00:00").getDay()
        const diaUtil = escala?.dias_semana?.includes(diaSemana) ?? [1, 2, 3, 4, 5].includes(diaSemana)
        if (!diaUtil) continue

        const key = `${func.id}|${data}`
        const regs = regsPorFuncData.get(key) || []
        const ajusteKey = `${func.id}|${data}`
        const justificativas = ajustesPorFuncData.tipos.get(ajusteKey)
        const estaJustificado = !!justificativas && justificativas.size > 0
        const justificativaId = ajustesPorFuncData.ids.get(ajusteKey) || null

        const temEntrada = regs.some(r => r.tipo === "entrada")
        const temSaidaAlmoco = regs.some(r => r.tipo === "saida_almoco")
        const temRetornoAlmoco = regs.some(r => r.tipo === "retorno_almoco")
        const temSaida = regs.some(r => r.tipo === "saida")
        const entrada = regs.find(r => r.tipo === "entrada")
        const saida = regs.find(r => r.tipo === "saida")

        if (regs.length === 0) {
          result.push({
            id: `falta-${func.id}-${data}`,
            funcionario_id: func.id,
            funcionario_nome: func.nome,
            funcionario_matricula: func.matricula,
            funcionario_cargo: func.cargo,
            data,
            tipo: "falta",
            descricao: "Nenhum registro de ponto encontrado",
            hora_esperada: escala?.hora_entrada || null,
            hora_registrada: null,
            tolerancia,
            escala_nome: escala?.nome || null,
            registro_ponto_id: null,
            justificado: estaJustificado,
            justificativa_id: justificativaId,
          })
          continue
        }

        if (temEntrada && entrada) {
          const horaEntrada = new Date(entrada.data_hora)
          const esperado = escala?.hora_entrada
          if (esperado) {
            const [h, m] = esperado.split(":").map(Number)
            const esperadoDate = new Date(data + "T" + esperado)
            const diffMin = (horaEntrada.getTime() - esperadoDate.getTime()) / 60000
            if (diffMin > tolerancia) {
              result.push({
                id: `atraso-${func.id}-${data}`,
                funcionario_id: func.id,
                funcionario_nome: func.nome,
                funcionario_matricula: func.matricula,
                funcionario_cargo: func.cargo,
                data,
                tipo: "atraso",
                descricao: `Registrou entrada ${Math.round(diffMin)}min após o horário`,
                hora_esperada: esperado,
                hora_registrada: entrada.data_hora,
                tolerancia,
                escala_nome: escala?.nome || null,
                registro_ponto_id: entrada.id,
                justificado: justificativas?.has("justificativa_atraso") ?? false,
                justificativa_id: justificativaId,
              })
            }
          }
        }

        if (temEntrada && !temSaida) {
          const ultimoReg = regs[regs.length - 1]
          const agora = new Date()
          const dataDate = new Date(data + "T23:59:59")
          if (new Date(ultimoReg.data_hora) < dataDate || new Date(ultimoReg.data_hora) < agora) {
            result.push({
              id: `saida-pendente-${func.id}-${data}`,
              funcionario_id: func.id,
              funcionario_nome: func.nome,
              funcionario_matricula: func.matricula,
              funcionario_cargo: func.cargo,
              data,
              tipo: "saida_pendente",
              descricao: "Registrou entrada mas não registrou saída",
              hora_esperada: escala?.hora_saida || null,
              hora_registrada: ultimoReg?.data_hora || null,
              tolerancia,
              escala_nome: escala?.nome || null,
              registro_ponto_id: ultimoReg?.id || null,
              justificado: estaJustificado,
              justificativa_id: justificativaId,
            })
          }
        }

        if (temSaida && saida && escala?.hora_saida) {
          const horaSaida = new Date(saida.data_hora)
          const esperadoDate = new Date(data + "T" + escala.hora_saida)
          const diffMin = (esperadoDate.getTime() - horaSaida.getTime()) / 60000
          if (diffMin > tolerancia) {
            result.push({
              id: `saida-antecipada-${func.id}-${data}`,
              funcionario_id: func.id,
              funcionario_nome: func.nome,
              funcionario_matricula: func.matricula,
              funcionario_cargo: func.cargo,
              data,
              tipo: "saida_antecipada",
              descricao: `Registrou saída ${Math.round(diffMin)}min antes do horário`,
              hora_esperada: escala.hora_saida,
              hora_registrada: saida.data_hora,
              tolerancia,
              escala_nome: escala?.nome || null,
              registro_ponto_id: saida.id,
              justificado: estaJustificado,
              justificativa_id: justificativaId,
            })
          }
        }

        if (company?.usa_almoco !== false && escala?.hora_saida_almoco && escala?.hora_retorno_almoco) {
          if ((temSaidaAlmoco && !temRetornoAlmoco) || (!temSaidaAlmoco && temRetornoAlmoco) ||
              (!temSaidaAlmoco && !temRetornoAlmoco && regs.length >= 3)) {
            result.push({
              id: `almoco-incompleto-${func.id}-${data}`,
              funcionario_id: func.id,
              funcionario_nome: func.nome,
              funcionario_matricula: func.matricula,
              funcionario_cargo: func.cargo,
              data,
              tipo: "almoco_incompleto",
              descricao: temSaidaAlmoco ? "Registrou saída almoço mas não o retorno" : "Registro de almoço incompleto",
              hora_esperada: escala.hora_saida_almoco,
              hora_registrada: null,
              tolerancia,
              escala_nome: escala?.nome || null,
              registro_ponto_id: null,
              justificado: estaJustificado,
              justificativa_id: justificativaId,
            })
          }
        }
      }
    }

    return result
  }, [funcionarios, registros, escalas, funcionarioEscalas, diasDoMes, ajustesPorFuncData, dataInicio])

  const filtered = useMemo(() => {
    return ocorrencias.filter(o => {
      if (filtroTipo !== "todas" && o.tipo !== filtroTipo) return false
      if (filtroFuncionario !== "todos" && o.funcionario_id !== filtroFuncionario) return false
      if (search && !o.funcionario_nome.toLowerCase().includes(search.toLowerCase()) &&
          !o.funcionario_matricula.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [ocorrencias, filtroTipo, filtroFuncionario, search])

  const stats = useMemo(() => {
    const total = ocorrencias.length
    const faltas = ocorrencias.filter(o => o.tipo === "falta").length
    const atrasos = ocorrencias.filter(o => o.tipo === "atraso").length
    const saidasPendentes = ocorrencias.filter(o => o.tipo === "saida_pendente").length
    const saidasAntecipadas = ocorrencias.filter(o => o.tipo === "saida_antecipada").length
    const almocos = ocorrencias.filter(o => o.tipo === "almoco_incompleto").length
    const justificadas = ocorrencias.filter(o => o.justificado).length
    return { total, faltas, atrasos, saidasPendentes, saidasAntecipadas, almocos, justificadas }
  }, [ocorrencias])

  const handleJustificar = async () => {
    if (!justificarTarget || !justificativaTexto.trim() || !company?.id) return
    try {
      const { error } = await supabase.from("ajustes").insert({
        funcionario_id: justificarTarget.funcionario_id,
        empresa_id: company.id,
        tipo: justificarTarget.tipo === "atraso" ? "justificativa_atraso"
          : justificarTarget.tipo === "falta" ? "abono_falta"
          : "correcao_ponto",
        data_referencia: justificarTarget.data,
        justificativa: justificativaTexto,
        status: "aprovado",
        registro_ponto_id: justificarTarget.registro_ponto_id,
      })
      if (error) throw error
      toast.success("Ocorrência justificada com sucesso!")
      setJustificarOpen(false)
      setJustificativaTexto("")
      setJustificarTarget(null)
      carregarDados()
    } catch (err: any) {
      toast.error(err.message || "Erro ao justificar")
    }
  }

  const handleCorrigirSaida = async (ocorrencia: Ocorrencia) => {
    if (!company?.id) return
    try {
      const dataHora = new Date(ocorrencia.data + "T" + (ocorrencia.hora_esperada || "18:00"))
      const { error } = await supabase.from("registros_ponto").insert({
        funcionario_id: ocorrencia.funcionario_id,
        empresa_id: company.id,
        tipo: "saida",
        data_hora: dataHora.toISOString(),
        data: ocorrencia.data,
        hash_integridade: "correcao_admin",
      })
      if (error) throw error
      toast.success("Saída registrada com sucesso!")
      carregarDados()
    } catch (err: any) {
      toast.error(err.message || "Erro ao corrigir")
    }
  }

  const agruparPorFuncionario = useMemo(() => {
    const grupos: Record<string, Ocorrencia[]> = {}
    for (const o of filtered) {
      if (!grupos[o.funcionario_id]) grupos[o.funcionario_id] = []
      grupos[o.funcionario_id].push(o)
    }
    return Object.entries(grupos).sort((a, b) => a[1][0].funcionario_nome.localeCompare(b[1][0].funcionario_nome))
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ocorrências</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} ocorrências detectadas · {stats.justificadas} justificadas
          </p>
        </div>
        <Button variant="outline" onClick={carregarDados} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
        {[
          { label: "Total", value: stats.total, color: COLORS.blue },
          { label: "Faltas", value: stats.faltas, color: COLORS.red },
          { label: "Atrasos", value: stats.atrasos, color: COLORS.amber },
          { label: "Saída Pend.", value: stats.saidasPendentes, color: COLORS.purple },
          { label: "Saída Antec.", value: stats.saidasAntecipadas, color: COLORS.amber },
          { label: "Almoço Inc.", value: stats.almocos, color: COLORS.amber },
          { label: "Justificadas", value: stats.justificadas, color: COLORS.green },
        ].map((s) => (
          <GlassCard key={s.label} className="text-center p-3 sm:p-4">
            <p className="text-xs text-muted-foreground truncate">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar funcionário..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os tipos</SelectItem>
            <SelectItem value="falta">Falta</SelectItem>
            <SelectItem value="atraso">Atraso</SelectItem>
            <SelectItem value="saida_pendente">Saída Pendente</SelectItem>
            <SelectItem value="saida_antecipada">Saída Antecipada</SelectItem>
            <SelectItem value="almoco_incompleto">Almoço Incompleto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroFuncionario} onValueChange={setFiltroFuncionario}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos funcionários</SelectItem>
            {funcionarios.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {new Date(2000, i).toLocaleString("pt-BR", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Occurrences List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : agruparPorFuncionario.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="text-lg font-medium">Nenhuma ocorrência encontrada</p>
          <p className="text-sm">Todas as escalas estão em dia para o período selecionado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agruparPorFuncionario.map(([funcId, ocorrencias]) => (
            <GlassCard key={funcId} className="overflow-hidden">
              <button
                onClick={() => setExpandido(prev => ({ ...prev, [funcId]: !prev[funcId] }))}
                className="w-full flex items-center justify-between p-4 hover:bg-glass/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center text-black font-bold text-sm shrink-0">
                    {ocorrencias[0].funcionario_nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ocorrencias[0].funcionario_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {ocorrencias[0].funcionario_matricula}
                      {ocorrencias[0].funcionario_cargo && ` · ${ocorrencias[0].funcionario_cargo}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-1">
                    {["falta", "atraso", "saida_pendente", "saida_antecipada", "almoco_incompleto"].map(t => {
                      const count = ocorrencias.filter(o => o.tipo === t).length
                      if (count === 0) return null
                      return (
                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                          {count}{TIPO_OCORRENCIA_LABEL[t].charAt(0)}
                        </Badge>
                      )
                    })}
                  </div>
                  {expandido[funcId] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {expandido[funcId] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-glass-border divide-y divide-glass-border">
                      {ocorrencias.map((oco) => {
                        const Icon = TIPO_OCORRENCIA_ICON[oco.tipo]
                        return (
                          <div key={oco.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{
                                color: oco.tipo === "falta" ? COLORS.red
                                  : oco.tipo === "atraso" ? COLORS.amber
                                  : oco.tipo === "saida_pendente" ? COLORS.purple
                                  : oco.tipo === "saida_antecipada" ? COLORS.amber
                                  : COLORS.amber
                              }} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{TIPO_OCORRENCIA_LABEL[oco.tipo]}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {new Date(oco.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                  </Badge>
                                  {oco.justificado && (
                                    <Badge className="bg-green-500/10 text-green-400 text-[10px] border-green-500/20">
                                      Justificado
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{oco.descricao}</p>
                                {oco.hora_esperada && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Esperado: {oco.hora_esperada}
                                    {oco.hora_registrada && ` · Registrado: ${new Date(oco.hora_registrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                                    {oco.escala_nome && ` · ${oco.escala_nome}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {!oco.justificado && (
                                <Button variant="outline" size="sm" className="h-8 text-xs"
                                  onClick={() => { setJustificarTarget(oco); setJustificativaTexto(""); setJustificarOpen(true) }}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Justificar
                                </Button>
                              )}
                              {oco.tipo === "saida_pendente" && (
                                <Button size="sm" className="h-8 text-xs"
                                  onClick={() => handleCorrigirSaida(oco)}>
                                  <Clock className="w-3.5 h-3.5 mr-1" /> Corrigir Saída
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Justify Dialog */}
      <Dialog open={justificarOpen} onOpenChange={setJustificarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justificar Ocorrência</DialogTitle>
            <DialogDescription>
              {justificarTarget && (
                <>{justificarTarget.funcionario_nome} · {TIPO_OCORRENCIA_LABEL[justificarTarget.tipo]}
                  · {new Date(justificarTarget.data + "T12:00:00").toLocaleDateString("pt-BR")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Justificativa</Label>
              <Textarea value={justificativaTexto} onChange={(e) => setJustificativaTexto(e.target.value)}
                placeholder="Descreva o motivo da ocorrência..." rows={3} />
            </div>
            <Button className="w-full" onClick={handleJustificar} disabled={!justificativaTexto.trim()}>
              Salvar Justificativa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}