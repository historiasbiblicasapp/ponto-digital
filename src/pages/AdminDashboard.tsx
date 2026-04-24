import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShoppingBag, TrendingUp, Shield } from "lucide-react"

const AdminDashboard = () => {
  const { data: tenants } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: allUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
      if (error) throw error
      return data
    }
  })

  const { data: allOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
      if (error) throw error
      return data
    }
  })

  const activeTenants = tenants?.filter(t => t.active).length || 0
  const totalUsers = allUsers?.length || 0
  const totalOrders = allOrders?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Clientes Ativos</CardTitle>
            <Users className="w-8 h-8 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">{activeTenants}</div>
            <p className="text-xs text-slate-500">de {tenants?.length || 0} cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Usuários</CardTitle>
            <Shield className="w-8 h-8 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">{totalUsers}</div>
            <p className="text-xs text-slate-500">usuários nos clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Vendas</CardTitle>
            <ShoppingBag className="w-8 h-8 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">{totalOrders}</div>
            <p className="text-xs text-slate-500">vendas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Receita Total</CardTitle>
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">
              R$ {allOrders?.reduce((sum, o) => sum + Number(o.total_cost), 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">em todas as lojas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants?.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{tenant.name}</p>
                  <p className="text-sm text-slate-500">{tenant.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tenant.primary_color || "#16a34a" }}
                  />
                  <span className={`text-sm ${tenant.active ? "text-green-600" : "text-red-500"}`}>
                    {tenant.active ? "Ativo" : "Bloqueado"}
                  </span>
                </div>
              </div>
            ))}
            {!tenants?.length && (
              <p className="text-center text-slate-500 py-4">Nenhum cliente cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard