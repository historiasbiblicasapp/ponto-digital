import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassCard, StatCard, LiveIndicator, PulseDot, AnimatedCounter, GaugeChart } from "@/components/ui/glass-card"
import {
  Users, Clock, AlertTriangle, TrendingUp, UserCheck, UserX,
  RefreshCw, Activity, BarChart3, Zap, Shield, Calendar,
  ArrowUpRight, ArrowDownRight, CircleDashed
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts"
import type { Funcionario, RegistroPonto } from "@/integrations/supabase/ponto-digital"

interface ResumoDia {
  total: number; online: number; offline: number
  atrasados: number; sem_registro: number; horas_extras_total: number
}

const COLORS = { green: "#00ff88", blue: "#00b4ff", amber: "#f59e0b", red: "#ff3366", purple: "#8b5cf6", cyan: "#22d3ee" }

export default function AdminDashboard() {
  const { company } = useAuth()
  const [resumo, setResumo] = useState<ResumoDia>({ total: 0, online: 0, offline: 0, atrasados: 0, sem_registro: 0, horas_extras_total: 0 })
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date())
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [timeline, setTimeline] = useState<{ hora: string; registros: number }[]>([])

  useEffect(() => {
    const interval = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (company?.id) {
      carregarDashboard()
      const interval = setInterval(carregarDashboard, 30000)
      return () => clearInterval(interval)
    }
  }, [company])

  const carregarDashboard = async () => {
    if (!company?.id) return
    try {
      const [funcRes, regRes] = await Promise.all([
        supabase.from("funcionarios").select("*").eq("empresa_id", company.id).eq("ativo", true),
        supabase.from("registros_ponto").select("*").eq("empresa_id", company.id).eq("data", new Date().toISOString().split("T")[0]).order("data_hora", { ascending: false })
      ])

      const funcs = funcRes.data || []
      const registrosHoje = regRes.data || []
      setFuncionarios(funcs)

      const ultimosPorFunc: Record<string, RegistroPonto[]> = {}
      for (const r of registrosHoje) {
        if (!ultimosPorFunc[r.funcionario_id]) ultimosPorFunc[r.funcionario_id] = []
        ultimosPorFunc[r.funcionario_id].push(r)
      }

      let online = 0, atrasados = 0, semRegistro = 0, totalExtras = 0
      for (const f of funcs) {
        const regs = ultimosPorFunc[f.id] || []
        if (regs.length === 0) { semRegistro++; continue }
        const ultimo = regs.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())[0]
        if (["entrada", "retorno_almoco", "extra_inicio"].includes(ultimo.tipo)) {
          online++
          if (new Date(ultimo.data_hora).getHours() > 8) atrasados++
        } else { offline++ }
        if (regs.length >= 4) {
          const sorted = regs.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
          let totalMin = 0
          for (let i = 0; i < sorted.length - 1; i++) {
            const diff = new Date(sorted[i + 1].data_hora).getTime() - new Date(sorted[i].data_hora).getTime()
            if (diff > 0 && diff < 72000000) totalMin += diff / 60000
          }
          totalExtras += Math.max(0, (totalMin / 60) - 8)
        }
      }

      setResumo({ total: funcs.length, online, offline, atrasados, sem_registro: semRegistro, horas_extras_total: Math.round(totalExtras * 100) / 100 })

      const horaCounts: Record<string, number> = {}
      for (const r of registrosHoje) {
        const h = new Date(r.data_hora).getHours().toString().padStart(2, "0")
        horaCounts[h] = (horaCounts[h] || 0) + 1
      }
      setTimeline(Object.entries(horaCounts).map(([hora, registros]) => ({ hora: `${hora}:00`, registros })))
      setUltimaAtualizacao(new Date())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const stats = useMemo(() => [
    { title: "Total Funcionários", value: resumo.total, icon: Users, color: "blue" as const, trend: { value: 0, positive: true } },
    { title: "Online Agora", value: resumo.online, icon: UserCheck, color: "green" as const, trend: { value: Math.round((resumo.online / (resumo.total || 1)) * 100), positive: true } },
    { title: "Atrasados", value: resumo.atrasados, icon: AlertTriangle, color: "amber" as const, trend: { value: Math.round((resumo.atrasados / (resumo.total || 1)) * 100), positive: false } },
    { title: "Sem Registro", value: resumo.sem_registro, icon: UserX, color: "red" as const, trend: { value: Math.round((resumo.sem_registro / (resumo.total || 1)) * 100), positive: false } },
    { title: "Horas Extras", value: `${resumo.horas_extras_total}h`, icon: TrendingUp, color: "purple" as const },
    { title: "Registros Hoje", value: resumo.total - resumo.sem_registro, icon: Activity, color: "primary" as const, trend: { value: Math.round(((resumo.total - resumo.sem_registro) / (resumo.total || 1)) * 100), positive: true } },
  ], [resumo])

  const pieData = [
    { name: "Online", value: resumo.online, color: COLORS.green },
    { name: "Offline", value: resumo.offline, color: COLORS.blue },
    { name: "Sem Registro", value: resumo.sem_registro, color: COLORS.amber },
    { name: "Atrasados", value: resumo.atrasados, color: COLORS.red },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard{' '}
              <span className="text-gradient-primary">RH</span>
            </h1>
            <LiveIndicator label="Ao vivo" status="online" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{company?.nome_fantasia || company?.name}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="font-mono text-xs">{horaAtual.toLocaleTimeString("pt-BR")}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>Atualizado {ultimaAtualizacao.toLocaleTimeString("pt-BR")}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass border border-glass-border">
            <PulseDot />
            <span className="text-xs font-medium text-muted-foreground">Sistema operacional</span>
          </div>
          <Button variant="outline" size="sm" onClick={carregarDashboard} className="neo-button-outline !px-3 !py-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Grid de stats premium */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i * 0.08} />
        ))}
      </div>

      {/* Cards principais: Gráficos e indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline de registros */}
        <GlassCard variant="premium" className="lg:col-span-2 p-6" glow delay={0.3}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Registros do Dia</h3>
                <p className="text-xs text-muted-foreground">Distribuição por hora</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-glass border-glass-border text-xs">
              {resumo.total - resumo.sem_registro} registros
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline.length > 0 ? timeline : [{ hora: "08:00", registros: 0 }]}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    backdropFilter: "blur(20px)",
                  }}
                />
                <Area type="monotone" dataKey="registros" stroke={COLORS.green} strokeWidth={2} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pizza Status */}
        <GlassCard variant="premium" className="p-6" glow delay={0.4}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Status</h3>
                <p className="text-xs text-muted-foreground">Funcionários hoje</p>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    backdropFilter: "blur(20px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-semibold ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Gauge + Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center" delay={0.5}>
          <GaugeChart value={resumo.online} max={resumo.total || 1} label="Online" color="green" />
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center" delay={0.55}>
          <GaugeChart value={resumo.atrasados} max={resumo.total || 1} label="Atrasados" color="amber" />
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center" delay={0.6}>
          <GaugeChart value={resumo.sem_registro} max={resumo.total || 1} label="Sem Registro" color="red" />
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center" delay={0.65}>
          <GaugeChart value={resumo.horas_extras_total} max={40} label="Horas Extras (h)" color="blue" />
        </GlassCard>
      </div>

      {/* Tabela de funcionários premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <GlassCard variant="premium" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Funcionários</h3>
                <p className="text-xs text-muted-foreground">{funcionarios.length} ativos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 inline-block animate-ping-slow" />
                {resumo.online} online
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                {resumo.atrasados} atrasados
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                {resumo.sem_registro} sem registro
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto ds-table-wrapper">
            <table className="w-full ds-table">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Matrícula</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Setor</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Hoje</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {funcionarios.map((f, i) => (
                    <motion.tr
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-glass-border last:border-0 hover:bg-glass transition-colors ds-table-row"
                    >
                      <td className="py-3 font-mono text-sm text-muted-foreground" data-label="Matrícula">{f.matricula}</td>
                      <td className="py-3 font-medium" data-label="Nome">{f.nome}</td>
                      <td className="py-3 text-sm text-muted-foreground" data-label="Setor">{f.setor || '-'}</td>
                      <td className="py-3" data-label="Status">
                        <Badge variant="outline" className={f.ativo ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                          {f.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 ds-td-label" data-label="">
                        <PulseDot />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {funcionarios.length === 0 && !loading && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum funcionário cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
