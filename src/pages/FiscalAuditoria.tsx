import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Shield, FileCode, FileText, FileJson, Download, Search,
  Clock, UserCheck, AlertTriangle, Activity, Scale
} from "lucide-react"
import { STACK, CARD_PADDING, TEXT, FLEX, TABLE, GRID } from "@/lib/design-system"

interface AuditLog {
  id: string
  empresa_id: string | null
  auth_user_id: string | null
  acao: string
  tabela_afetada: string | null
  registro_id: string | null
  dados_anteriores: any
  dados_novos: any
  ip: string | null
  created_at: string
}

const FiscalAuditoria = () => {
  const { company } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [acaoFilter, setAcaoFilter] = useState("all")

  useEffect(() => {
    if (company?.id) carregarAuditoria()
  }, [company])

  const carregarAuditoria = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("empresa_id", company.id)
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) throw error
      setAuditLogs(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar auditoria:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = auditLogs.filter(log => {
    if (acaoFilter !== "all" && log.acao !== acaoFilter) return false
    if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const acaoBadge = (acao: string) => {
    switch (acao) {
      case "INSERT": return <Badge className="bg-green-100 text-green-700">INSERT</Badge>
      case "UPDATE": return <Badge className="bg-blue-100 text-blue-700">UPDATE</Badge>
      case "DELETE": return <Badge className="bg-red-100 text-red-700">DELETE</Badge>
      default: return <Badge>{acao}</Badge>
    }
  }

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div>
          <h1 className={TEXT.pageTitle}>Fiscal e Auditoria</h1>
          <p className={TEXT.body}>Conformidade Portaria 671/2021 e trilha de auditoria</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregarAuditoria}>
          <Activity className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className={GRID.stat4}>
        <Card className="p-3 sm:p-4 text-center border-amber-200 bg-amber-50/50">
          <Shield className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-2 text-amber-600" />
          <p className={TEXT.kpi}>{auditLogs.length}</p>
          <p className={TEXT.small}>Total de registros</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-green-200 bg-green-50/50">
          <UserCheck className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
          <p className={TEXT.kpi}>{auditLogs.filter(l => l.acao === "INSERT").length}</p>
          <p className={TEXT.small}>Inclusões</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-blue-200 bg-blue-50/50">
          <FileText className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
          <p className={TEXT.kpi}>{auditLogs.filter(l => l.acao === "UPDATE").length}</p>
          <p className={TEXT.small}>Alterações</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-red-200 bg-red-50/50">
          <AlertTriangle className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-2 text-red-600" />
          <p className={TEXT.kpi}>{auditLogs.filter(l => l.acao === "DELETE").length}</p>
          <p className={TEXT.small}>Exclusões</p>
        </Card>
      </div>

      <Tabs defaultValue="auditoria">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="auditoria" className="gap-1 text-xs sm:text-sm"><Activity className="w-3 h-3 sm:w-4 sm:h-4" />Auditoria</TabsTrigger>
          <TabsTrigger value="conformidade" className="gap-1 text-xs sm:text-sm"><Scale className="w-3 h-3 sm:w-4 sm:h-4" />Conformidade</TabsTrigger>
          <TabsTrigger value="exportar" className="gap-1 text-xs sm:text-sm"><FileCode className="w-3 h-3 sm:w-4 sm:h-4" />Exportações Legais</TabsTrigger>
        </TabsList>

        <TabsContent value="auditoria" className={STACK.section + " mt-4 sm:mt-6"}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na auditoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={acaoFilter} onValueChange={setAcaoFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="INSERT">Inclusões</SelectItem>
                <SelectItem value="UPDATE">Alterações</SelectItem>
                <SelectItem value="DELETE">Exclusões</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className={CARD_PADDING.table}>
            <div className={TABLE.wrapper}>
              <table className={TABLE.table}>
                <thead>
                  <tr className="border-b">
                    <th className={TABLE.th}>Data/Hora</th>
                    <th className={TABLE.th}>Ação</th>
                    <th className={TABLE.th}>Tabela</th>
                    <th className={TABLE.th}>Registro</th>
                    <th className={TABLE.th}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4">
                        <div className={STACK.tight}>
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum registro de auditoria</td></tr>
                  ) : filtered.map((log) => (
                    <tr key={log.id} className={`border-b last:border-0 hover:bg-muted/50 ${TABLE.row}`}>
                      <td className={TABLE.td} data-label="Data/Hora"><span className="text-xs font-mono">{new Date(log.created_at).toLocaleString("pt-BR")}</span></td>
                      <td className={TABLE.td} data-label="Ação">{acaoBadge(log.acao)}</td>
                      <td className={TABLE.td} data-label="Tabela"><span className={TEXT.body}>{log.tabela_afetada || "-"}</span></td>
                      <td className={TABLE.td} data-label="Registro"><span className="text-xs font-mono text-muted-foreground">{log.registro_id?.slice(0, 8) || "-"}...</span></td>
                      <td className={`${TABLE.td} ds-td-label`} data-label="">
                        <div className={FLEX.center}>
                          {log.dados_anteriores && (
                            <Badge variant="outline" className="text-xs cursor-pointer"
                              onClick={() => toast.info(JSON.stringify(log.dados_anteriores, null, 2))}
                            >
                              Anterior
                            </Badge>
                          )}
                          {log.dados_novos && (
                            <Badge variant="outline" className="text-xs cursor-pointer"
                              onClick={() => toast.info(JSON.stringify(log.dados_novos, null, 2))}
                            >
                              Novo
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="conformidade" className="mt-4 sm:mt-6">
          <Card className={`${CARD_PADDING.spacious} border-2 border-green-200`}>
            <h2 className={TEXT.sectionTitle + " mb-4 flex items-center gap-2"}>
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Status de Conformidade - Portaria MTP 671/2021
            </h2>
            <div className={GRID.cards2}>
              {[
                { label: "Registros com Hash SHA256", ok: true, desc: "Integridade garantida via trigger no banco" },
                { label: "Auditoria de Operações", ok: true, desc: "Triggers de auditoria em todas as tabelas críticas" },
                { label: "Arquivo AFD", ok: true, desc: "Geração de Arquivo Fonte de Dados" },
                { label: "Espelho de Ponto", ok: true, desc: "Geração de espelho mensal para assinatura" },
                { label: "Logs Imutáveis", ok: true, desc: "Auditoria com timestamp do servidor" },
                { label: "LGPD", ok: true, desc: "Consentimentos e direitos do titular implementados" },
                { label: "RLS - Isolamento", ok: true, desc: "Row Level Security por empresa" },
                { label: "Backup Automático", ok: false, desc: "Configure backup automático no Supabase" },
              ].map((item) => (
                <div key={item.label} className={FLEX.start + " p-3 bg-muted/50 rounded-lg"}>
                  {item.ok
                    ? <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 shrink-0" />
                  }
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{item.label}</p>
                    <p className={TEXT.small}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exportar" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <h2 className={TEXT.sectionTitle + " mb-4"}>Exportações Legais</h2>
            <div className={GRID.cards3}>
              <Button variant="outline" className="h-20 sm:h-24 flex-col gap-2" onClick={() => {
                const csv = [["Data", "Ação", "Tabela", "Registro"].join(","),
                  ...auditLogs.map(l =>
                    [l.created_at, l.acao, l.tabela_afetada, l.registro_id].join(",")
                  )].join("\n")
                const blob = new Blob(['\uFEFF' + csv], { type: "text/csv" })
                const a = document.createElement("a")
                a.href = URL.createObjectURL(blob)
                a.download = `auditoria_${new Date().toISOString().split("T")[0]}.csv`
                a.click()
                toast.success("Auditoria exportada em CSV")
              }}>
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className={TEXT.small}>Exportar Auditoria (CSV)</span>
              </Button>

              <Button variant="outline" className="h-20 sm:h-24 flex-col gap-2" onClick={() => {
                const json = JSON.stringify(auditLogs, null, 2)
                const blob = new Blob([json], { type: "application/json" })
                const a = document.createElement("a")
                a.href = URL.createObjectURL(blob)
                a.download = `auditoria_${new Date().toISOString().split("T")[0]}.json`
                a.click()
                toast.success("Auditoria exportada em JSON")
              }}>
                <FileJson className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className={TEXT.small}>Exportar Auditoria (JSON)</span>
              </Button>

              <Button variant="outline" className="h-20 sm:h-24 flex-col gap-2" onClick={() => {
                const total = auditLogs.length
                const inserts = auditLogs.filter(l => l.acao === "INSERT").length
                const updates = auditLogs.filter(l => l.acao === "UPDATE").length
                const deletes = auditLogs.filter(l => l.acao === "DELETE").length
                const relatorio = {
                  empresa: company?.nome_fantasia || company?.name,
                  cnpj: company?.cnpj,
                  dataGeracao: new Date().toISOString(),
                  periodo: {
                    inicio: auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].created_at : null,
                    fim: auditLogs.length > 0 ? auditLogs[0].created_at : null,
                  },
                  resumo: { total, inserts, updates, deletes },
                  portaria: "MTP 671/2021",
                  sistema: "Ponto Digital BM v1.0",
                }
                const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: "application/json" })
                const a = document.createElement("a")
                a.href = URL.createObjectURL(blob)
                a.download = `relatorio_auditoria_${new Date().toISOString().split("T")[0]}.json`
                a.click()
                toast.success("Relatório de auditoria gerado!")
              }}>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className={TEXT.small}>Relatório de Auditoria</span>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export default FiscalAuditoria
