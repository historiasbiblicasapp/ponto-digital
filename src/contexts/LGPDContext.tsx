import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"

export interface Consentimento {
  id: string
  tipo: "termos_uso" | "privacidade" | "dados_biometricos" | "geolocalizacao" | "comunicacao"
  aceito: boolean
  data_aceite: string | null
  versao_termo: string | null
}

interface LGPDContextType {
  consentimentos: Consentimento[]
  loading: boolean
  precisaConsentir: boolean
  precisaReconsentir: boolean
  aceitarTermo: (tipo: Consentimento["tipo"], versao?: string) => Promise<void>
  revogarConsentimento: (tipo: Consentimento["tipo"]) => Promise<void>
  solicitarExportacaoDados: () => Promise<void>
  solicitarExclusaoDados: (descricao: string) => Promise<void>
  solicitarCorrecaoDados: (descricao: string) => Promise<void>
  solicitarAcessoDados: (descricao: string) => Promise<void>
  verificarConsentimento: (tipo: Consentimento["tipo"]) => boolean
  versaoAtual: string
}

const VERSAO_TERMOS = "1.0.0"

const LGPDContext = createContext<LGPDContextType | undefined>(undefined)

export const LGPDProvider = ({ children }: { children: ReactNode }) => {
  const { user, company } = useAuth()
  const [consentimentos, setConsentimentos] = useState<Consentimento[]>([])
  const [loading, setLoading] = useState(true)

  const precisaConsentir = !consentimentos.some(c => c.tipo === "termos_uso" && c.aceito)
  const precisaReconsentir = consentimentos.some(
    c => c.tipo === "termos_uso" && c.aceito && c.versao_termo !== VERSAO_TERMOS
  )

  useEffect(() => {
    if (user?.funcionario?.id) {
      carregarConsentimentos()
    } else {
      setLoading(false)
    }
  }, [user])

  const carregarConsentimentos = async () => {
    if (!user?.funcionario?.id) return
    try {
      const { data } = await supabase
        .from("consentimentos_lgpd")
        .select("*")
        .eq("funcionario_id", user.funcionario.id)
        .order("created_at", { ascending: false })

      const agrupados: Consentimento[] = []
      const vistos = new Set<string>()
      for (const item of data || []) {
        if (!vistos.has(item.tipo)) {
          vistos.add(item.tipo)
          agrupados.push({
            id: item.id,
            tipo: item.tipo,
            aceito: item.aceito,
            data_aceite: item.data_aceite,
            versao_termo: item.versao_termo,
          })
        }
      }
      setConsentimentos(agrupados)
    } catch (err) {
      console.error("Erro ao carregar consentimentos:", err)
    } finally {
      setLoading(false)
    }
  }

  const aceitarTermo = async (tipo: Consentimento["tipo"], versao?: string) => {
    if (!user?.funcionario?.id || !company?.id) return
    try {
      const ip = await fetch("https://api.ipify.org?format=json").then(r => r.json()).then(d => d.ip).catch(() => null)
      const { error } = await supabase.from("consentimentos_lgpd").insert({
        empresa_id: company.id,
        funcionario_id: user.funcionario.id,
        auth_user_id: user.id,
        tipo,
        aceito: true,
        ip,
        dispositivo_info: navigator.userAgent,
        versao_termo: versao || VERSAO_TERMOS,
      })
      if (error) throw error
      toast.success("Consentimento registrado com sucesso!")
      await carregarConsentimentos()
    } catch (err: any) {
      toast.error("Erro ao registrar consentimento")
    }
  }

  const revogarConsentimento = async (tipo: Consentimento["tipo"]) => {
    if (!user?.funcionario?.id) return
    try {
      await supabase
        .from("consentimentos_lgpd")
        .update({ aceito: false, data_revogacao: new Date().toISOString() })
        .eq("funcionario_id", user.funcionario.id)
        .eq("tipo", tipo)
      toast.success("Consentimento revogado")
      await carregarConsentimentos()
    } catch (err: any) {
      toast.error("Erro ao revogar consentimento")
    }
  }

  const solicitarExportacaoDados = async () => {
    if (!user?.funcionario?.id || !company?.id) return
    try {
      const { data: registrosPonto } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("funcionario_id", user.funcionario.id)
        .order("data_hora", { ascending: true })

      const dadosExportacao = {
        funcionario: user.funcionario,
        registrosPonto: registrosPonto || [],
        consentimentos,
        dataRequisicao: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `meus_dados_${user.funcionario.matricula}_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      await supabase.from("lgpd_solicitacoes").insert({
        empresa_id: company.id,
        funcionario_id: user.funcionario.id,
        auth_user_id: user.id,
        tipo: "exportacao",
        status: "concluido",
      })

      toast.success("Dados exportados com sucesso!")
    } catch (err: any) {
      toast.error("Erro ao exportar dados")
    }
  }

  const solicitarExclusaoDados = async (descricao: string) => {
    if (!user?.funcionario?.id || !company?.id) return
    try {
      await supabase.from("lgpd_solicitacoes").insert({
        empresa_id: company.id,
        funcionario_id: user.funcionario.id,
        auth_user_id: user.id,
        tipo: "exclusao",
        descricao,
        status: "pendente",
      })
      toast.success("Solicitação de exclusão enviada! Seu RH analisará o pedido.")
    } catch (err: any) {
      toast.error("Erro ao solicitar exclusão")
    }
  }

  const solicitarCorrecaoDados = async (descricao: string) => {
    if (!user?.funcionario?.id || !company?.id) return
    try {
      await supabase.from("lgpd_solicitacoes").insert({
        empresa_id: company.id,
        funcionario_id: user.funcionario.id,
        auth_user_id: user.id,
        tipo: "correcao",
        descricao,
        status: "pendente",
      })
      toast.success("Solicitação de correção enviada! Seu RH analisará o pedido.")
    } catch (err: any) {
      toast.error("Erro ao solicitar correção")
    }
  }

  const solicitarAcessoDados = async (descricao: string) => {
    if (!user?.funcionario?.id || !company?.id) return
    try {
      await supabase.from("lgpd_solicitacoes").insert({
        empresa_id: company.id,
        funcionario_id: user.funcionario.id,
        auth_user_id: user.id,
        tipo: "acesso",
        descricao,
        status: "pendente",
      })
      toast.success("Solicitação de acesso registrada! Seu RH analisará o pedido.")
    } catch (err: any) {
      toast.error("Erro ao solicitar acesso")
    }
  }

  const verificarConsentimento = (tipo: Consentimento["tipo"]): boolean => {
    return consentimentos.some(c => c.tipo === tipo && c.aceito)
  }

  return (
    <LGPDContext.Provider
      value={{
        consentimentos,
        loading,
        precisaConsentir,
        precisaReconsentir,
        aceitarTermo,
        revogarConsentimento,
        solicitarExportacaoDados,
        solicitarExclusaoDados,
        solicitarCorrecaoDados,
        solicitarAcessoDados,
        verificarConsentimento,
        versaoAtual: VERSAO_TERMOS,
      }}
    >
      {children}
    </LGPDContext.Provider>
  )
}

export const useLGPD = () => {
  const context = useContext(LGPDContext)
  if (!context) throw new Error("useLGPD must be used within LGPDProvider")
  return context
}
