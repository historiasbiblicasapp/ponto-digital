import { Shield } from "lucide-react"

const DPOFooter = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3 border-t border-glass-border">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          <span>
            <strong>Encarregado (DPO):</strong> contato@pontodigitalbm.com.br
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>LGPD - Lei nº 13.709/2018</span>
          <span>•</span>
          <span>ANPD: anpd.gov.br</span>
        </div>
      </div>
    </div>
  )
}

export default DPOFooter
