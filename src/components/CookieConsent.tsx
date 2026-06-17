import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

const CookieConsent = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consentido = localStorage.getItem("cookie_consent")
    if (!consentido) setShow(true)
  }, [])

  const aceitar = () => {
    localStorage.setItem("cookie_consent", "true")
    setShow(false)
  }

  const recusar = () => {
    localStorage.setItem("cookie_consent", "false")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto bg-card border border-glass-border rounded-2xl shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Cookies e Privacidade</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Utilizamos cookies essenciais para o funcionamento do sistema. 
              Ao continuar navegando, você concorda com o uso de cookies conforme nossa 
              Política de Privacidade (LGPD - Lei nº 13.709/2018).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={recusar}>Recusar</Button>
            <Button size="sm" onClick={aceitar}>Aceitar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
