import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { FileText, CheckCircle2, XCircle, Clock, AlertCircle, Search } from "lucide-react"
import type { Ajuste } from "@/integrations/supabase/ponto-digital"
import { TIPOS_AJUSTE } from "@/integrations/supabase/ponto-digital"
import { STACK, CARD_PADDING, TEXT, FLEX } from "@/lib/design-system"

const AdminTimeRequests = () => {
  const { company, user } = useAuth()
  const [ajustes, setAjustes] = useState<Ajuste[]>([])
  const [loading, setLoading] = useState(true)
  const [observacao, setObservacao] = useState<Record<string, string>>({})

  useEffect(() => {
    if (company?.id) carregarAjustes()
  }, [company])

  const carregarAjustes = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("ajustes")
        .select("*")
        .eq("empresa_id", company.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAjustes(data || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (ajuste: Ajuste) => {
    try {
      const { error } = await supabase
        .from("ajustes")
        .update({
          status: "aprovado",
          aprovado_por: user?.funcionario?.id || null,
          observacao_rh: observacao[ajuste.id] || null,
        })
        .eq("id", ajuste.id)

      if (error) throw error
      toast.success("Solicitação aprovada!")
      carregarAjustes()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleReject = async (ajuste: Ajuste) => {
    if (!observacao[ajuste.id]) {
      toast.error("Adicione uma observação para recusar")
      return
    }
    try {
      const { error } = await supabase
        .from("ajustes")
        .update({
          status: "recusado",
          aprovado_por: user?.funcionario?.id || null,
          observacao_rh: observacao[ajuste.id],
        })
        .eq("id", ajuste.id)

      if (error) throw error
      toast.success("Solicitação recusada")
      carregarAjustes()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const tipoLabel = (tipo: string) => TIPOS_AJUSTE.find(a => a.value === tipo)?.label || tipo

  const statusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>
      case "recusado":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
    }
  }

  const pendentes = ajustes.filter(a => a.status === "pendente")
  const historico = ajustes.filter(a => a.status !== "pendente")

  return (
    <div className={STACK.page}>
      <div>
        <h1 className={TEXT.pageTitle}>Solicitações RH</h1>
        <p className={TEXT.body}>
          {pendentes.length} pendentes • {historico.length} analisadas
        </p>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pendentes" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className={STACK.section + " mt-4 sm:mt-6"}>
          {loading ? (
            <div className={STACK.tight}>
              {[1, 2].map((i) => (
                <Card key={i} className={CARD_PADDING.standard + " border-l-4 border-l-yellow-400"}>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : pendentes.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-green-500" />
              <p className="text-base sm:text-lg">Nenhuma solicitação pendente</p>
              <p className={TEXT.body + " mt-2"}>Todas as solicitações foram analisadas</p>
            </Card>
          ) : pendentes.map((a) => (
            <Card key={a.id} className={"p-4 sm:p-6 border-l-4 border-l-yellow-400"}>
              <div className={FLEX.between + " mb-3 sm:mb-4"}>
                <div className="min-w-0">
                  <div className={FLEX.center + " mb-1 flex-wrap"}>
                    <span className="font-semibold text-sm sm:text-base">{tipoLabel(a.tipo)}</span>
                    {statusBadge(a.status)}
                  </div>
                  <p className={TEXT.body}>
                    Funcionário ID: {a.funcionario_id.slice(0, 8)}... • Data: {new Date(a.data_referencia + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className={TEXT.small + " shrink-0"}>
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4">
                <p className={TEXT.label + " mb-1"}>Justificativa:</p>
                <p className={TEXT.body}>{a.justificativa}</p>
              </div>

              <div className={STACK.tight}>
                <Textarea
                  placeholder="Observação do RH (obrigatório para recusar)..."
                  value={observacao[a.id] || ""}
                  onChange={(e) => setObservacao({ ...observacao, [a.id]: e.target.value })}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(a)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(a)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />Recusar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historico" className={STACK.tight + " mt-4 sm:mt-6"}>
          {loading ? (
            <div className={STACK.tight}>
              {[1, 2].map((i) => (
                <Card key={i} className={CARD_PADDING.standard}>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-full" />
                </Card>
              ))}
            </div>
          ) : historico.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center text-muted-foreground">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg">Nenhuma solicitação analisada</p>
            </Card>
          ) : historico.map((a) => (
            <Card key={a.id} className={CARD_PADDING.standard}>
              <div className={FLEX.between}>
                <div className={STACK.tight + " min-w-0 flex-1"}>
                  <div className={FLEX.center + " flex-wrap"}>
                    <span className="font-semibold text-sm sm:text-base">{tipoLabel(a.tipo)}</span>
                    {statusBadge(a.status)}
                  </div>
                  <p className={TEXT.body}>{a.justificativa}</p>
                  {a.observacao_rh && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm">
                      <span className="font-medium">RH: </span>{a.observacao_rh}
                    </div>
                  )}
                </div>
                <p className={TEXT.small + " shrink-0"}>
                  {new Date(a.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminTimeRequests
