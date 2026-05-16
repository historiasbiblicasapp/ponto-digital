import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useLGPD } from "@/contexts/LGPDContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Shield, Download, Trash2, CheckCircle2, XCircle, FileText,
  UserCheck, Clock, MapPin, Eye
} from "lucide-react"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID } from "@/lib/design-system"

const LGPDMeusDados = () => {
  const { user } = useAuth()
  const {
    consentimentos, aceitarTermo, revogarConsentimento,
    solicitarExportacaoDados, solicitarExclusaoDados
  } = useLGPD()
  const [exclusaoDesc, setExclusaoDesc] = useState("")
  const [exportando, setExportando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const handleExportar = async () => {
    setExportando(true)
    try {
      await solicitarExportacaoDados()
    } finally {
      setExportando(false)
    }
  }

  const handleSolicitarExclusao = async () => {
    if (!exclusaoDesc.trim()) {
      toast.error("Descreva o motivo da solicitação")
      return
    }
    setExcluindo(true)
    try {
      await solicitarExclusaoDados(exclusaoDesc)
      setExclusaoDesc("")
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className={STACK.page}>
      <div className={FLEX.center}>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div>
          <h1 className={TEXT.pageTitle}>Meus Dados (LGPD)</h1>
          <p className={TEXT.body}>Gerencie seus dados pessoais e consentimentos</p>
        </div>
      </div>

      {user?.funcionario && (
        <Card className={CARD_PADDING.standard}>
          <div className={FLEX.center + " mb-4"}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">{user.funcionario.nome}</h2>
              <p className={TEXT.small}>
                {user.funcionario.cargo} • {user.funcionario.setor} • Matrícula {user.funcionario.matricula}
              </p>
            </div>
          </div>
          <div className={GRID.form2 + " text-xs sm:text-sm"}>
            <div><span className={TEXT.small}>Email:</span> {user.email}</div>
            <div><span className={TEXT.small}>Matrícula:</span> {user.funcionario.matricula}</div>
            <div><span className={TEXT.small}>Cargo:</span> {user.funcionario.cargo || "-"}</div>
            <div><span className={TEXT.small}>Setor:</span> {user.funcionario.setor || "-"}</div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="consentimentos">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="consentimentos" className="gap-1 text-xs sm:text-sm"><Shield className="w-3 h-3 sm:w-4 sm:h-4" />Consentimentos</TabsTrigger>
          <TabsTrigger value="exportar" className="gap-1 text-xs sm:text-sm"><Download className="w-3 h-3 sm:w-4 sm:h-4" />Exportar Dados</TabsTrigger>
          <TabsTrigger value="excluir" className="gap-1 text-xs sm:text-sm"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />Exclusão</TabsTrigger>
        </TabsList>

        <TabsContent value="consentimentos" className={STACK.section + " mt-4 sm:mt-6"}>
          <Card className={CARD_PADDING.standard}>
            <h3 className={TEXT.sectionTitle + " mb-4"}>Meus Consentimentos</h3>
            <div className={STACK.tight}>
              {[
                { tipo: "termos_uso" as const, label: "Termos de Uso", desc: "Aceite dos termos de uso do sistema" },
                { tipo: "privacidade" as const, label: "Política de Privacidade", desc: "Aceite da política de privacidade" },
                { tipo: "geolocalizacao" as const, label: "Geolocalização", desc: "Coleta de localização no registro de ponto" },
                { tipo: "dados_biometricos" as const, label: "Dados Biométricos", desc: "Armazenamento de foto e dados biométricos" },
                { tipo: "comunicacao" as const, label: "Comunicação", desc: "Envio de notificações e comunicados" },
              ].map((item) => {
                const consent = consentimentos.find(c => c.tipo === item.tipo)
                const aceito = consent?.aceito || false
                return (
                  <div key={item.tipo} className={FLEX.between + " p-3 bg-muted/50 rounded-lg"}>
                    <div className={FLEX.center + " min-w-0 flex-1"}>
                      {aceito
                        ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                        : <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{item.label}</p>
                        <p className={TEXT.small + " truncate"}>{item.desc}</p>
                        {consent?.data_aceite && (
                          <p className={TEXT.small + " mt-0.5"}>
                            Aceito em {new Date(consent.data_aceite).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {!aceito ? (
                        <Button size="sm" variant="outline" onClick={() => aceitarTermo(item.tipo)}>
                          Aceitar
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-red-500 text-xs" onClick={() => revogarConsentimento(item.tipo)}>
                          Revogar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exportar" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="text-center space-y-4">
              <Download className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto" />
              <h3 className={TEXT.sectionTitle}>Exportar Meus Dados</h3>
              <p className={TEXT.body + " max-w-md mx-auto"}>
                Solicite a exportação de todos os seus dados pessoais armazenados no sistema,
                incluindo registros de ponto, consentimentos e informações do funcionário.
              </p>
              <div className="bg-muted rounded-lg p-4 text-left text-xs sm:text-sm space-y-2">
                <p className="font-medium">Serão exportados:</p>
                <ul className={STACK.tight + " text-muted-foreground"}>
                  <li className={FLEX.center}><UserCheck className="w-3 h-3" /> Dados do funcionário</li>
                  <li className={FLEX.center}><Clock className="w-3 h-3" /> Todos os registros de ponto</li>
                  <li className={FLEX.center}><MapPin className="w-3 h-3" /> Geolocalização das marcações</li>
                  <li className={FLEX.center}><Shield className="w-3 h-3" /> Histórico de consentimentos</li>
                </ul>
              </div>
              <Button onClick={handleExportar} disabled={exportando}>
                {exportando ? "Exportando..." : "Exportar Meus Dados (JSON)"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="excluir" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="text-center space-y-4">
              <Trash2 className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 mx-auto" />
              <h3 className={TEXT.sectionTitle}>Solicitar Exclusão de Dados</h3>
              <p className={TEXT.body + " max-w-md mx-auto"}>
                Solicite a exclusão dos seus dados pessoais do sistema. Sua solicitação será
                analisada pelo RH da empresa conforme a LGPD e prazos legais de retenção.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-left text-xs sm:text-sm">
                <p className={FLEX.center + " font-medium text-amber-800"}>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  Atenção
                </p>
                <p className="text-amber-700 mt-1">
                  Registros de ponto são mantidos por 5 anos conforme legislação trabalhista.
                  A exclusão será aplicada apenas após o prazo legal de retenção.
                </p>
              </div>
              <div className="text-left space-y-2">
                <Label className={TEXT.label}>Motivo da solicitação</Label>
                <Textarea
                  placeholder="Descreva o motivo da solicitação de exclusão..."
                  value={exclusaoDesc}
                  onChange={(e) => setExclusaoDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <Button variant="destructive" onClick={handleSolicitarExclusao} disabled={excluindo} className="w-full sm:w-auto">
                {excluindo ? "Enviando..." : "Solicitar Exclusão de Dados"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LGPDMeusDados
