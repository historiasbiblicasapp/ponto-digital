import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlassCard, LiveIndicator, PulseDot } from "@/components/ui/glass-card"
import { toast } from "sonner"
import { Clock, MapPin, CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { useGeolocation } from "@/hooks/useGeolocation"
import { obterUltimoRegistro, obterRegistrosDoDia, registrarPonto } from "@/lib/ponto-utils"
import { formatarTempoRegistro, formatarDataRegistro, calcularHorasTrabalhadas, calcularSaldo } from "@/integrations/supabase/ponto-digital"
import type { TipoRegistro } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID } from "@/lib/design-system"

const EmployeeDashboard = () => {
  const { user, company } = useAuth()
  const geo = useGeolocation()
  const [registros, setRegistros] = useState<any[]>([])
  const [ultimoRegistro, setUltimoRegistro] = useState<TipoRegistro | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [horarioAtual, setHorarioAtual] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setHorarioAtual(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user?.funcionario?.id) carregarDados()
  }, [user])

  const carregarDados = async () => {
    if (!user?.funcionario?.id) return
    setLoading(true)
    try {
      const hoje = await obterRegistrosDoDia(user.funcionario.id)
      setRegistros(hoje)
      const ultimo = await obterUltimoRegistro(user.funcionario.id)
      setUltimoRegistro(ultimo?.tipo || null)
    } catch (err: any) { console.error(err) }
    finally { setLoading(false) }
  }

  const getProximoRegistro = useCallback((): TipoRegistro => {
    if (!ultimoRegistro) return 'entrada'
    switch (ultimoRegistro) {
      case 'entrada': return 'saida_almoco'
      case 'saida_almoco': return 'retorno_almoco'
      case 'retorno_almoco': return 'saida'
      case 'saida': return 'entrada'
      default: return 'entrada'
    }
  }, [ultimoRegistro])

  const getInfoProximoRegistro = () => {
    const tipo = getProximoRegistro()
    const configs = {
      entrada: { label: 'Registrar Entrada', icon: LogIn, gradient: 'from-emerald-500/20 to-green-500/5', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', textColor: 'text-emerald-400' },
      saida_almoco: { label: 'Registrar Saída Almoço', icon: Coffee, gradient: 'from-amber-500/20 to-yellow-500/5', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', textColor: 'text-amber-400' },
      retorno_almoco: { label: 'Registrar Retorno Almoço', icon: Utensils, gradient: 'from-amber-500/20 to-yellow-500/5', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', textColor: 'text-amber-400' },
      saida: { label: 'Registrar Saída Final', icon: LogOut, gradient: 'from-red-500/20 to-rose-500/5', border: 'border-red-500/30', glow: 'shadow-red-500/20', textColor: 'text-red-400' },
    }
    return configs[tipo]
  }

  const handleRegistrar = async () => {
    if (!user?.funcionario?.id || !company?.id || registrando) return
    setRegistrando(true)
    try {
      if (!geo.latitude || !geo.longitude) await geo.atualizar()
      const tipo = getProximoRegistro()
      const novoRegistro = await registrarPonto({
        funcionario_id: user.funcionario.id,
        empresa_id: company.id,
        tipo,
        latitude: geo.latitude?.toString() || null,
        longitude: geo.longitude?.toString() || null,
        endereco: geo.address,
      })
      toast.success(`${getInfoProximoRegistro()?.label} registrado!`, {
        description: `às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      })
      await carregarDados()
    } catch (err: any) {
      toast.error("Erro ao registrar", { description: err.message })
    } finally { setRegistrando(false) }
  }

  const info = getInfoProximoRegistro()
  const horas = registros.length > 0 ? calcularHorasTrabalhadas(registros) : '00:00'
  const saldo = registros.length > 0 ? calcularSaldo(registros, 8) : '00:00'
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className={FLEX.center + " justify-center mb-1"}>
          <PulseDot />
          <span className={TEXT.small + " font-medium"}>Sistema Online</span>
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-medium text-muted-foreground">
            Olá, <span className="font-bold text-foreground">{user?.funcionario?.nome || user?.email}</span>
          </h1>
          <p className={TEXT.small + " capitalize"}>{dataHoje}</p>
        </div>
        <motion.div
          key={horarioAtual.getTime()}
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold font-mono tracking-tight text-gradient-primary"
        >
          {horarioAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </motion.div>
        <LiveIndicator label="Ao vivo" status="online" />
      </motion.div>

      {/* Botão principal - Registro */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard
          variant="premium"
          className={`p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 border-2 ${info?.border} ${info?.glow} hover:scale-[1.02] active:scale-[0.98]`}
          glow
        >
          <motion.button
            onClick={handleRegistrar}
            disabled={registrando}
            className="w-full space-y-4 sm:space-y-5"
            whileTap={{ scale: 0.97 }}
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto relative"
                style={{ background: `linear-gradient(135deg, ${info?.textColor.replace('text-', '').replace('-400', '')}20, transparent)` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {info?.icon && <info.icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" style={{ color: info?.textColor.replace('text-', '') }} strokeWidth={1.5} />}
              </motion.div>
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${info?.textColor}`}>
                {info?.label}
              </h2>
              <p className={TEXT.small + " mt-1"}>
                Toque para registrar seu ponto
              </p>
            </div>
          </motion.button>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {registrando && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center"
          >
            <div className={FLEX.center + " justify-center"}>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-primary font-semibold">Registrando ponto...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Registros Hoje", value: registros.length, icon: Clock },
          { label: "Horas Trabalhadas", value: horas, icon: Zap },
          { label: "Saldo", value: saldo + 'h', icon: saldo.startsWith('+') ? TrendingUp : saldo.startsWith('-') ? TrendingDown : MinusIcon },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Timeline de registros do dia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard variant="premium" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Registros de Hoje</h3>
              <p className="text-xs text-muted-foreground">{registros.length} marcações</p>
            </div>
          </div>

          {registros.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhum registro hoje</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Registre seu primeiro ponto</p>
            </div>
          ) : (
            <div className="relative">
              {registros.map((r, i) => {
                const tipoLabel: Record<string, string> = {
                  entrada: 'Entrada', saida_almoco: 'Saída Almoço',
                  retorno_almoco: 'Retorno Almoço', saida: 'Saída Final',
                  extra_inicio: 'Extra Início', extra_fim: 'Extra Fim'
                }
                const isLast = i === registros.length - 1
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`timeline-item ${isLast ? 'active' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10 shrink-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm truncate">{tipoLabel[r.tipo] || r.tipo}</span>
                      </div>
                      <span className="text-base sm:text-lg font-mono font-bold shrink-0">
                        {formatarTempoRegistro(r.data_hora)}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Geolocalização */}
      <AnimatePresence>
        {geo.latitude && geo.longitude && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={FLEX.center + " justify-center text-xs text-muted-foreground"}
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span>Localização capturada • {geo.address?.slice(0, 50) || `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const TrendingUp = ({ className, strokeWidth }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

const TrendingDown = ({ className, strokeWidth }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
)

const MinusIcon = ({ className, strokeWidth }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default EmployeeDashboard
