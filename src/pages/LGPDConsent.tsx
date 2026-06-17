import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useLGPD } from "@/contexts/LGPDContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Shield, CheckCircle2, FileText, AlertTriangle, Fingerprint, Bell } from "lucide-react"
import { toast } from "sonner"

const LEGAL_BASES: Record<string, string> = {
  termos_uso: "Art. 7º, I - mediante consentimento do titular",
  privacidade: "Art. 7º, I - mediante consentimento do titular",
  geolocalizacao: "Art. 7º, I e IX - consentimento e proteção à saúde",
  dados_biometricos: "Art. 7º, II - obrigação legal (CLT, Portaria MTP 671/2021)",
  comunicacao: "Art. 7º, I - mediante consentimento do titular",
}

const LGPDConsent = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { aceitarTermo, precisaConsentir, precisaReconsentir, verificarConsentimento, versaoAtual } = useLGPD()
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false)
  const [geolocAceita, setGeolocAceita] = useState(false)
  const [biometricosAceitos, setBiometricosAceitos] = useState(false)
  const [comunicacaoAceita, setComunicacaoAceita] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleAceitarTodos = async () => {
    setSubmitting(true)
    try {
      await aceitarTermo("termos_uso", versaoAtual)
      await aceitarTermo("privacidade", versaoAtual)
      if (geolocAceita) await aceitarTermo("geolocalizacao", versaoAtual)
      if (biometricosAceitos) await aceitarTermo("dados_biometricos", versaoAtual)
      if (comunicacaoAceita) await aceitarTermo("comunicacao", versaoAtual)
      toast.success("Consentimentos registrados com sucesso!")
      navigate("/app")
    } catch (err: any) {
      toast.error("Erro ao registrar consentimento")
    } finally {
      setSubmitting(false)
    }
  }

  const tudoAceito = termosAceitos && privacidadeAceita

  if (!precisaConsentir && !precisaReconsentir && verificarConsentimento("termos_uso")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="w-full max-w-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">Consentimento Registrado</h1>
          <p className="text-muted-foreground mb-6">
            Você já aceitou os termos de uso e política de privacidade (v{versaoAtual}).
          </p>
          <Button onClick={() => navigate("/app")}>Ir para o Sistema</Button>
        </Card>
      </div>
    )
  }

  const isReconsentimento = precisaReconsentir

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{isReconsentimento ? "Atualização dos Termos" : "Privacidade e Termos"}</h1>
          <p className="text-muted-foreground">
            {isReconsentimento
              ? `${user?.funcionario?.nome}, os termos foram atualizados para a versão ${versaoAtual}. Seu novo consentimento é necessário.`
              : `${user?.funcionario?.nome}, precisamos do seu consentimento para continuar`
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Termos de Uso */}
          <Card className="p-6 border-2 border-blue-100 bg-blue-50/50">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">1. Termos de Uso <span className="text-xs font-normal text-muted-foreground">(obrigatório)</span></h3>
                <p className="text-xs text-muted-foreground mt-1">{LEGAL_BASES.termos_uso}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ao utilizar o sistema, você concorda com as regras de registro de ponto eletrônico,
                  veracidade das informações fornecidas e uso adequado da plataforma.
                </p>
                <Button variant="link" className="px-0 h-auto text-sm" onClick={() => setShowTerms(true)}>
                  Ler Termos de Uso na íntegra →
                </Button>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="termos"
                    checked={termosAceitos}
                    onCheckedChange={(c) => setTermosAceitos(c as boolean)}
                  />
                  <Label htmlFor="termos" className="text-sm font-medium">
                    Aceito os Termos de Uso
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Política de Privacidade */}
          <Card className="p-6 border-2 border-green-100 bg-green-50/50">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">2. Política de Privacidade <span className="text-xs font-normal text-muted-foreground">(obrigatório)</span></h3>
                <p className="text-xs text-muted-foreground mt-1">{LEGAL_BASES.privacidade}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seus dados pessoais (nome, CPF, e-mail, registros de ponto) são armazenados de forma
                  segura e utilizados apenas para controle de jornada. Consulte nossa política completa.
                </p>
                <Button variant="link" className="px-0 h-auto text-sm" onClick={() => setShowPrivacy(true)}>
                  Ler Política de Privacidade na íntegra →
                </Button>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="privacidade"
                    checked={privacidadeAceita}
                    onCheckedChange={(c) => setPrivacidadeAceita(c as boolean)}
                  />
                  <Label htmlFor="privacidade" className="text-sm font-medium">
                    Aceito a Política de Privacidade
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Geolocalização */}
          <Card className="p-6 border-2 border-amber-100 bg-amber-50/50">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">3. Geolocalização <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
                <p className="text-xs text-muted-foreground mt-1">{LEGAL_BASES.geolocalizacao}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Autoriza a coleta de dados de localização no momento do registro de ponto
                  para fins de comprovação de jornada. Você pode registrar ponto sem compartilhar
                  sua localização.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="geoloc"
                    checked={geolocAceita}
                    onCheckedChange={(c) => setGeolocAceita(c as boolean)}
                  />
                  <Label htmlFor="geoloc" className="text-sm font-medium">
                    Autorizo coleta de geolocalização
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Dados Biométricos */}
          <Card className="p-6 border-2 border-purple-100 bg-purple-50/50">
            <div className="flex items-start gap-4">
              <Fingerprint className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">4. Dados Biométricos <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
                <p className="text-xs text-muted-foreground mt-1">{LEGAL_BASES.dados_biometricos}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Autoriza o armazenamento da sua foto e dados biométricos para identificação
                  no registro de ponto eletrônico, conforme exigência da Portaria MTP 671/2021.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="biometricos"
                    checked={biometricosAceitos}
                    onCheckedChange={(c) => setBiometricosAceitos(c as boolean)}
                  />
                  <Label htmlFor="biometricos" className="text-sm font-medium">
                    Autorizo armazenamento de dados biométricos
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Comunicação */}
          <Card className="p-6 border-2 border-teal-100 bg-teal-50/50">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-teal-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">5. Comunicação <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
                <p className="text-xs text-muted-foreground mt-1">{LEGAL_BASES.comunicacao}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Autoriza o envio de notificações, comunicados e alertas relacionados
                  ao controle de ponto e jornada de trabalho.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="comunicacao"
                    checked={comunicacaoAceita}
                    onCheckedChange={(c) => setComunicacaoAceita(c as boolean)}
                  />
                  <Label htmlFor="comunicacao" className="text-sm font-medium">
                    Autorizo recebimento de comunicações
                  </Label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</p>
          <p>
            Seus dados são tratados conforme a LGPD. Você pode solicitar exportação, correção,
            acesso ou exclusão dos seus dados a qualquer momento através do menu LGPD no sistema.
            Guardamos registros de ponto pelo prazo legal de 5 anos (art. 74 CLT c/c art. 12 Portaria 671/2021).
            Encarregado (DPO): contato@pontodigitalbm.com.br.
          </p>
        </div>

        <Button
          className="w-full h-14 text-lg"
          disabled={!tudoAceito || submitting}
          onClick={handleAceitarTodos}
        >
          {submitting ? "Registrando..." : "Aceitar e Continuar"}
        </Button>

        <Dialog open={showTerms} onOpenChange={setShowTerms}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Termos de Uso</DialogTitle>
              <DialogDescription>Versão {versaoAtual}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">1. Aceitação dos Termos</h3>
              <p>Ao utilizar o Ponto Digital BM ("Sistema"), o usuário declara ter lido, compreendido e aceitado todos os termos e condições estabelecidos neste documento.</p>

              <h3 className="font-bold text-lg">2. Objeto</h3>
              <p>O Sistema tem como finalidade o controle eletrônico de jornada de trabalho, registrando os horários de entrada, saída, pausas e intervalos dos funcionários, conforme legislação trabalhista vigente.</p>

              <h3 className="font-bold text-lg">3. Obrigações do Usuário</h3>
              <p>3.1. Realizar os registros de ponto de forma verídica e pontual;<br />
              3.2. Manter sigilo das credenciais de acesso;<br />
              3.3. Informar imediatamente qualquer uso não autorizado da conta;<br />
              3.4. Utilizar o Sistema apenas para fins profissionais.</p>

              <h3 className="font-bold text-lg">4. Propriedade Intelectual</h3>
              <p>O Sistema, seu código-fonte, design e funcionalidades são de propriedade exclusiva do fornecedor, sendo vedada cópia, distribuição ou engenharia reversa.</p>

              <h3 className="font-bold text-lg">5. Limitação de Responsabilidade</h3>
              <p>O fornecedor não se responsabiliza por danos decorrentes de uso indevido, falhas de internet, ou decisões baseadas em informações do Sistema.</p>

              <h3 className="font-bold text-lg">6. Disposições Gerais</h3>
              <p>6.1. Estes termos podem ser atualizados a qualquer momento, sendo comunicado ao usuário com 30 dias de antecedência;<br />
              6.2. O não cumprimento de qualquer cláusula poderá resultar na suspensão do acesso;<br />
              6.3. Fica eleito o foro da comarca do cliente para dirimir quaisquer controvérsias.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Política de Privacidade</DialogTitle>
              <DialogDescription>Versão {versaoAtual}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">1. Controlador dos Dados</h3>
              <p>Ponto Digital BM, inscrita sob CNPJ/CPF do contratante, é o controlador responsável pelos dados pessoais tratados no Sistema. Encarregado (DPO): contato@pontodigitalbm.com.br.</p>

              <h3 className="font-bold text-lg">2. Dados Coletados</h3>
              <p>2.1. Dados de identificação: nome, CPF, RG, foto, e-mail, telefone, cargo, setor, matrícula;<br />
              2.2. Dados de jornada: registros de ponto (data, hora, tipo), geolocalização (quando autorizada);<br />
              2.3. Dados biométricos: foto para identificação (quando autorizado);<br />
              2.4. Dados de navegação: IP, user agent, cookies essenciais.</p>

              <h3 className="font-bold text-lg">3. Finalidades do Tratamento</h3>
              <p>3.1. Controle de jornada de trabalho (Art. 74 CLT, Portaria MTP 671/2021);<br />
              3.2. Cumprimento de obrigações legais e trabalhistas;<br />
              3.3. Elaboração de folha de pagamento e banco de horas;<br />
              3.4. Atendimento a fiscalizações trabalhistas.</p>

              <h3 className="font-bold text-lg">4. Bases Legais (Art. 7º LGPD)</h3>
              <p>4.1. Consentimento do titular (Art. 7º, I) - para dados não obrigatórios;<br />
              4.2. Obrigação legal (Art. 7º, II) - registros de ponto exigidos pela CLT;<br />
              4.3. Exercício regular de direitos (Art. 7º, VI) - defesa em processos trabalhistas.</p>

              <h3 className="font-bold text-lg">5. Compartilhamento de Dados</h3>
              <p>5.1. Não compartilhamos dados com terceiros para fins comerciais;<br />
              5.2. Podemos compartilhar dados com autoridades trabalhistas e fiscais quando exigido por lei;<br />
              5.3. Os dados são armazenados em infraestrutura cloud da Supabase Inc. (EUA) com garantias contratuais adequadas (Cláusulas Contratuais Padrão - Art. 33 LGPD).</p>

              <h3 className="font-bold text-lg">6. Transferência Internacional</h3>
              <p>Os dados podem ser processados em servidores localizados nos Estados Unidos, com garantias contratuais adequadas conforme Art. 33 da LGPD e Cláusulas Contratuais Padrão da Comissão Europeia.</p>

              <h3 className="font-bold text-lg">7. Prazo de Retenção</h3>
              <p>7.1. Registros de ponto: 5 anos (art. 74 CLT c/c art. 12 Portaria MTP 671/2021);<br />
              7.2. Dados cadastrais: enquanto durar a relação de trabalho;<br />
              7.3. Consentimentos: enquanto vigente o consentimento;<br />
              7.4. Após os prazos, os dados são anonimizados ou excluídos conforme política de retenção.</p>

              <h3 className="font-bold text-lg">8. Direitos do Titular (Art. 18 LGPD)</h3>
              <p>8.1. Confirmar a existência de tratamento;<br />
              8.2. Acessar os dados;<br />
              8.3. Corrigir dados incompletos, inexatos ou desatualizados;<br />
              8.4. Anonimizar, bloquear ou eliminar dados desnecessários;<br />
              8.5. Portabilidade dos dados a outro fornecedor;<br />
              8.6. Eliminar dados tratados com consentimento;<br />
              8.7. Revogar consentimento a qualquer momento.</p>

              <h3 className="font-bold text-lg">9. Medidas de Segurança</h3>
              <p>9.1. Criptografia em trânsito (TLS 1.3) e em repouso (AES-256);<br />
              9.2. Controle de acesso baseado em função (RBAC);<br />
              9.3. Isolamento de dados entre empresas (multi-tenancy);<br />
              9.4. Auditoria de todas as operações via triggers no banco de dados.</p>

              <h3 className="font-bold text-lg">10. Incidentes de Segurança</h3>
              <p>Em caso de incidente que possa acarretar risco relevante aos titulares, a empresa comunicará à ANPD e aos titulares em até 72 horas (Art. 48 LGPD).</p>

              <h3 className="font-bold text-lg">11. Reclamações</h3>
              <p>O titular pode apresentar reclamações à ANPD (Autoridade Nacional de Proteção de Dados) através do site anpd.gov.br, após contatar o Encarregado pelo e-mail contato@pontodigitalbm.com.br.</p>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}

export default LGPDConsent

