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
import { Shield, CheckCircle2, FileText, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const LGPDConsent = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { aceitarTermo, precisaConsentir, verificarConsentimento, versaoAtual } = useLGPD()
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false)
  const [geolocAceita, setGeolocAceita] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleAceitarTodos = async () => {
    setSubmitting(true)
    try {
      await aceitarTermo("termos_uso", versaoAtual)
      await aceitarTermo("privacidade", versaoAtual)
      if (geolocAceita) await aceitarTermo("geolocalizacao", versaoAtual)
      toast.success("Todos os termos foram aceitos!")
      navigate("/app")
    } catch (err: any) {
      toast.error("Erro ao registrar consentimento")
    } finally {
      setSubmitting(false)
    }
  }

  const tudoAceito = termosAceitos && privacidadeAceita

  if (!precisaConsentir && verificarConsentimento("termos_uso")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="w-full max-w-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">Consentimento Registrado</h1>
          <p className="text-muted-foreground mb-6">
            Você já aceitou os termos de uso e política de privacidade.
          </p>
          <Button onClick={() => navigate("/app")}>Ir para o Sistema</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Privacidade e Termos</h1>
          <p className="text-muted-foreground">
            {user?.funcionario?.nome}, precisamos do seu consentimento para continuar
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-2 border-blue-100 bg-blue-50/50">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">1. Termos de Uso</h3>
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

          <Card className="p-6 border-2 border-green-100 bg-green-50/50">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">2. Política de Privacidade</h3>
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

          <Card className="p-6 border-2 border-amber-100 bg-amber-50/50">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">3. Geolocalização (opcional)</h3>
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
        </div>

        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</p>
          <p>
            Seus dados são tratados conforme a LGPD. Você pode solicitar exportação, correção ou
            exclusão dos seus dados a qualquer momento através do menu LGPD no sistema.
            Guardamos seus registros de ponto pelo prazo legal de 5 anos.
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
              <p>Ao utilizar o Ponto Digital BM, você concorda com estes termos.</p>
              <h3 className="font-bold text-lg">2. Registro de Ponto</h3>
              <p>O funcionário é responsável pela veracidade dos registros de ponto.</p>
              <h3 className="font-bold text-lg">3. Uso do Sistema</h3>
              <p>O sistema deve ser usado apenas para fins de controle de jornada.</p>
              <h3 className="font-bold text-lg">4. Responsabilidades</h3>
              <p>A empresa é responsável pela gestão dos dados dos seus funcionários.</p>
              <h3 className="font-bold text-lg">5. Disposições Gerais</h3>
              <p>Estes termos podem ser atualizados a qualquer momento.</p>
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
              <h3 className="font-bold text-lg">1. Dados Coletados</h3>
              <p>Coletamos nome, CPF, e-mail, cargo, setor e registros de ponto.</p>
              <h3 className="font-bold text-lg">2. Finalidade</h3>
              <p>Controle de jornada de trabalho conforme legislação trabalhista.</p>
              <h3 className="font-bold text-lg">3. Compartilhamento</h3>
              <p>Não compartilhamos dados com terceiros sem autorização.</p>
              <h3 className="font-bold text-lg">4. Armazenamento</h3>
              <p>Dados armazenados em servidores seguros com criptografia.</p>
              <h3 className="font-bold text-lg">5. Direitos do Titular</h3>
              <p>Você pode solicitar exportação, correção ou exclusão dos seus dados.</p>
              <h3 className="font-bold text-lg">6. Retenção</h3>
              <p>Registros de ponto são mantidos por 5 anos conforme legislação.</p>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}

export default LGPDConsent
