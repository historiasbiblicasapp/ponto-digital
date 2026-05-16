import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Clock, Download } from "lucide-react"
import { toast } from "sonner"
import { formatarTempoRegistro, formatarDataRegistro, calcularHorasTrabalhadas } from "@/integrations/supabase/ponto-digital"
import type { RegistroPonto } from "@/integrations/supabase/ponto-digital"
import { obterRegistrosPorMes } from "@/lib/ponto-utils"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID } from "@/lib/design-system"

const TimeHistory = () => {
  const { user } = useAuth()
  const [registros, setRegistros] = useState<Record<string, RegistroPonto[]>>({})
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => {
    if (user?.funcionario?.id) {
      carregarRegistros()
    }
  }, [user, mes, ano])

  const carregarRegistros = async () => {
    if (!user?.funcionario?.id) return
    setLoading(true)
    try {
      const data = await obterRegistrosPorMes(user.funcionario.id, mes, ano)
      const agrupados: Record<string, RegistroPonto[]> = {}
      for (const r of data) {
        const chave = r.data
        if (!agrupados[chave]) agrupados[chave] = []
        agrupados[chave].push(r)
      }
      setRegistros(agrupados)
    } catch (err: any) {
      toast.error("Erro ao carregar histórico")
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    toast.success("Relatório PDF será gerado")
  }

  const mesAnterior = () => {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else setMes(mes - 1)
  }

  const proximoMes = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  const nomeMes = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const dias = Object.keys(registros).sort().reverse()

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div className={FLEX.center}>
          <Button variant="outline" size="icon" onClick={mesAnterior} className="w-8 h-8 sm:w-9 sm:h-9">
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <h2 className="text-base sm:text-xl font-bold capitalize">{nomeMes}</h2>
          <Button variant="outline" size="icon" onClick={proximoMes} className="w-8 h-8 sm:w-9 sm:h-9">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {loading ? (
        <div className={STACK.tight}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className={CARD_PADDING.standard}>
              <Skeleton className="h-5 w-48 mb-3" />
              <div className={GRID.stat4}>
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </Card>
          ))}
        </div>
      ) : dias.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center text-muted-foreground">
          <Clock className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-base sm:text-lg">Nenhum registro neste mês</p>
        </Card>
      ) : (
        <div className={STACK.tight}>
          {dias.map((dia) => {
            const registrosDia = registros[dia]
            const horas = calcularHorasTrabalhadas(registrosDia)
            return (
              <Card key={dia} className={`${CARD_PADDING.standard} hover:shadow-md transition-shadow`}>
                <div className={FLEX.betweenNowrap + " mb-3"}>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={TEXT.small}>Total</p>
                    <p className="text-base sm:text-lg font-bold font-mono">{horas}h</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {registrosDia.map((r) => {
                    const tipoLabel =
                      r.tipo === 'entrada' ? 'Entrada' :
                      r.tipo === 'saida_almoco' ? 'Almoço S' :
                      r.tipo === 'retorno_almoco' ? 'Almoço R' :
                      r.tipo === 'saida' ? 'Saída' :
                      r.tipo === 'extra_inicio' ? 'Extra I' : 'Extra F'
                    return (
                      <div key={r.id} className="bg-muted rounded-lg p-2 text-center">
                        <p className={TEXT.small}>{tipoLabel}</p>
                        <p className="text-xs sm:text-sm font-mono font-bold">{formatarTempoRegistro(r.data_hora)}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimeHistory
