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
  UserCheck, Clock, MapPin, Eye, FileEdit, Fingerprint, Bell
} from "lucide-react"
import { STACK, CARD_PADDING, TEXT, FLEX, GRID } from "@/lib/design-system"

const LEGAL_BASES: Record<string, string> = {
  termos_uso: "Art. 7º, I LGPD - Consentimento",
  privacidade: "Art. 7º, I LGPD - Consentimento",
  geolocalizacao: "Art. 7º, I e IX LGPD - Consentimento e proteção à saúde",
  dados_biometricos: "Art. 7º, II LGPD - Obrigação legal (CLT, Portaria MTP 671/2021)",
  comunicacao: "Art. 7º, I LGPD - Consentimento",
}

const LGPDMeusDados = () => {
  const { user } = useAuth()
  const {
    consentimentos, aceitarTermo, revogarConsentimento,
    solicitarExportacaoDados, solicitarExclusaoDados,
    solicitarCorrecaoDados, solicitarAcessoDados
  } = useLGPD()
  const [exclusaoDesc, setExclusaoDesc] = useState("")
  const [correcaoDesc, setCorrecaoDesc] = useState("")
  const [acessoDesc, setAcessoDesc] = useState("")
  const [exportando, setExportando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [corrigindo, setCorrigindo] = useState(false)
  const [acessando, setAcessando] = useState(false)

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

  const handleSolicitarCorrecao = async () => {
    if (!correcaoDesc.trim()) {
      toast.error("Descreva quais dados deseja corrigir")
      return
    }
    setCorrigindo(true)
    try {
      await solicitarCorrecaoDados(correcaoDesc)
      setCorrecaoDesc("")
    } finally {
      setCorrigindo(false)
    }
  }

  const handleSolicitarAcesso = async () => {
    if (!acessoDesc.trim()) {
      toast.error("Descreva quais dados deseja acessar")
      return
    }
    setAcessando(true)
    try {
      await solicitarAcessoDados(acessoDesc)
      setAcessoDesc("")
    } finally {
      setAcessando(false)
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
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="consentimentos" className="gap-1 text-xs"><Shield className="w-3 h-3" />Consentimentos</TabsTrigger>
          <TabsTrigger value="exportar" className="gap-1 text-xs"><Download className="w-3 h-3" />Exportar</TabsTrigger>
          <TabsTrigger value="corrigir" className="gap-1 text-xs"><FileEdit className="w-3 h-3" />Corrigir</TabsTrigger>
          <TabsTrigger value="acessar" className="gap-1 text-xs"><Eye className="w-3 h-3" />Acessar</TabsTrigger>
          <TabsTrigger value="excluir" className="gap-1 text-xs"><Trash2 className="w-3 h-3" />Excluir</TabsTrigger>
        </TabsList>

        <TabsContent value="consentimentos" className={STACK.section + " mt-4 sm:mt-6"}>
          <Card className={CARD_PADDING.standard}>
            <h3 className={TEXT.sectionTitle + " mb-4"}>Meus Consentimentos</h3>
            <div className={STACK.tight}>
              {[
                { tipo: "termos_uso" as const, label: "Termos de Uso", desc: "Aceite dos termos de uso do sistema", icon: FileText },
                { tipo: "privacidade" as const, label: "Política de Privacidade", desc: "Aceite da política de privacidade", icon: Shield },
                { tipo: "geolocalizacao" as const, label: "Geolocalização", desc: "Coleta de localização no registro de ponto", icon: MapPin },
                { tipo: "dados_biometricos" as const, label: "Dados Biométricos", desc: "Armazenamento de foto e dados biométricos", icon: Fingerprint },
                { tipo: "comunicacao" as const, label: "Comunicação", desc: "Envio de notificações e comunicados", icon: Bell },
              ].map((item) => {
                const consent = consentimentos.find(c => c.tipo === item.tipo)
                const aceito = consent?.aceito || false
                const Icon = item.icon
                return (
                  <div key={item.tipo} className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <div className={FLEX.betweenNowrap}>
                      <div className={FLEX.center + " min-w-0 flex-1"}>
                        <Icon className={"w-4 h-4 shrink-0 " + (aceito ? "text-green-500" : "text-red-400")} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.label}</p>
                          <p className={TEXT.small + " truncate"}>{item.desc}</p>
                          <p className={TEXT.small + " text-primary"}>Base legal: {LEGAL_BASES[item.tipo]}</p>
                          {consent?.data_aceite && (
                            <p className={TEXT.small + " mt-0.5"}>
                              {aceito ? "Aceito" : "Revogado"} em {new Date(consent.data_aceite).toLocaleDateString("pt-BR")}
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
              <p className={TEXT.small}>Formato interoperável — você pode importar em outro sistema</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="corrigir" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="text-center space-y-4">
              <FileEdit className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500 mx-auto" />
              <h3 className={TEXT.sectionTitle}>Solicitar Correção de Dados</h3>
              <p className={TEXT.body + " max-w-md mx-auto"}>
                Solicite a correção de dados pessoais incompletos, inexatos ou desatualizados
                (Art. 18, III da LGPD).
              </p>
              <div className="text-left space-y-2">
                <Label className={TEXT.label}>Descreva quais dados devem ser corrigidos e como</Label>
                <Textarea
                  placeholder="Exemplo: Meu telefone mudou para (11) 99999-9999. Meu cargo agora é Analista Sênior..."
                  value={correcaoDesc}
                  onChange={(e) => setCorrecaoDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSolicitarCorrecao} disabled={corrigindo} className="w-full sm:w-auto">
                {corrigindo ? "Enviando..." : "Solicitar Correção de Dados"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="acessar" className="mt-4 sm:mt-6">
          <Card className={CARD_PADDING.spacious}>
            <div className="text-center space-y-4">
              <Eye className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500 mx-auto" />
              <h3 className={TEXT.sectionTitle}>Solicitar Acesso aos Dados</h3>
              <p className={TEXT.body + " max-w-md mx-auto"}>
                Solicite acesso detalhado a todos os seus dados pessoais tratados pelo sistema
                (Art. 18, I da LGPD).
              </p>
              <div className="text-left space-y-2">
                <Label className={TEXT.label}>Especifique quais dados deseja acessar (opcional)</Label>
                <Textarea
                  placeholder="Exemplo: Gostaria de acessar todos os registros de ponto dos últimos 12 meses e os logs de quem acessou meus dados..."
                  value={acessoDesc}
                  onChange={(e) => setAcessoDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSolicitarAcesso} disabled={acessando} className="w-full sm:w-auto">
                {acessando ? "Enviando..." : "Solicitar Acesso aos Dados"}
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
