import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, TrendingUp, DollarSign, Activity } from "lucide-react"
import type { Tenant } from "@/integrations/supabase/multi-tenant"
import { PLANOS_SAAS } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, TEXT, FLEX, TABLE, GRID } from "@/lib/design-system"

const MasterDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [totalFuncionarios, setTotalFuncionarios] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false })

      if (tenantsData) setTenants(tenantsData)

      const { count: funcCount } = await supabase
        .from("funcionarios")
        .select("*", { count: "exact", head: true })

      if (funcCount !== null) setTotalFuncionarios(funcCount)

      const { count: regCount } = await supabase
        .from("registros_ponto")
        .select("*", { count: "exact", head: true })

      if (regCount !== null) setTotalRegistros(regCount)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const receitaPotencial = tenants.reduce((sum, t) => {
    const plano = PLANOS_SAAS.find(p => p.id === t.plano)
    return sum + (plano?.preco || 0)
  }, 0)

  const stats = [
    {
      title: "Empresas Ativas",
      value: tenants.filter(t => t.active).length,
      total: tenants.length,
      icon: Building2,
      cor: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Funcionários",
      value: totalFuncionarios,
      icon: Users,
      cor: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Registros de Ponto",
      value: totalRegistros,
      icon: Activity,
      cor: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Receita Potencial",
      value: `R$ ${receitaPotencial.toFixed(2)}`,
      icon: DollarSign,
      cor: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ]

  return (
    <div className={STACK.page}>
      <div>
        <h1 className={TEXT.pageTitle}>Painel Master</h1>
        <p className={TEXT.body}>Visão geral do sistema Ponto Digital BM</p>
      </div>

      <div className={GRID.stat4}>
        {stats.map((stat) => (
          <Card key={stat.title} className={CARD_PADDING.standard}>
            <div className={FLEX.between}>
              <div>
                <p className={TEXT.label}>{stat.title}</p>
                <p className={TEXT.kpi + " mt-1"}>{stat.value}</p>
                {stat.total !== undefined && (
                  <p className={TEXT.small + " mt-1"}>de {stat.total} total</p>
                )}
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${stat.bg} shrink-0`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.cor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className={CARD_PADDING.standard}>
        <h2 className={TEXT.sectionTitle + " mb-4"}>Empresas</h2>
        <div className={TABLE.wrapper}>
          <table className={TABLE.table}>
            <thead>
              <tr className="border-b text-left">
                <th className={TABLE.th}>Empresa</th>
                <th className={TABLE.th}>CNPJ</th>
                <th className={TABLE.th}>Plano</th>
                <th className={TABLE.th}>Limite</th>
                <th className={TABLE.th}>Status</th>
                <th className={TABLE.th}>Desde</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className={`border-b last:border-0 hover:bg-muted/50 ${TABLE.row}`}>
                  <td className={TABLE.td} data-label="Empresa">
                    <p className="font-medium text-sm">{t.nome_fantasia || t.name}</p>
                    <p className={TEXT.small}>{t.razao_social || "-"}</p>
                  </td>
                  <td className={TABLE.td} data-label="CNPJ"><span className={TEXT.body}>{t.cnpj || "-"}</span></td>
                  <td className={TABLE.td} data-label="Plano">
                    <Badge variant="outline" className="text-xs">
                      {PLANOS_SAAS.find(p => p.id === t.plano)?.nome || t.plano || "Básico"}
                    </Badge>
                  </td>
                  <td className={TABLE.td} data-label="Limite"><span className={TEXT.body}>{t.limite_funcionarios} func.</span></td>
                  <td className={TABLE.td} data-label="Status">
                    <Badge
                      variant="outline"
                      className={t.active ? "bg-green-50 text-green-700 text-xs" : "bg-red-50 text-red-700 text-xs"}
                    >
                      {t.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className={TABLE.td} data-label="Desde"><span className={TEXT.small}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span></td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma empresa cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default MasterDashboard
