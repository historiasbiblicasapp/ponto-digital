import { useState, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { TipoRegistro, RegistroPonto } from "@/integrations/supabase/ponto-digital"

interface PontoState {
  registrando: boolean
  ultimoRegistro: RegistroPonto | null
  registrosHoje: RegistroPonto[]
}

export function usePonto(funcionarioId?: string, empresaId?: string) {
  const [state, setState] = useState<PontoState>({
    registrando: false,
    ultimoRegistro: null,
    registrosHoje: [],
  })

  const carregarRegistrosHoje = useCallback(async () => {
    if (!funcionarioId) return
    const hoje = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("funcionario_id", funcionarioId)
      .eq("data", hoje)
      .order("data_hora", { ascending: true })

    if (data) {
      setState(prev => ({
        ...prev,
        registrosHoje: data,
        ultimoRegistro: data.length > 0 ? data[data.length - 1] : null,
      }))
    }
  }, [funcionarioId])

  const getProximoRegistro = useCallback((): TipoRegistro => {
    const ultimo = state.ultimoRegistro?.tipo
    if (!ultimo) return "entrada"
    switch (ultimo) {
      case "entrada": return "saida_almoco"
      case "saida_almoco": return "retorno_almoco"
      case "retorno_almoco": return "saida"
      case "saida": return "entrada"
      default: return "entrada"
    }
  }, [state.ultimoRegistro])

  const registrar = useCallback(async (extraParams?: {
    latitude?: string | null
    longitude?: string | null
    endereco?: string | null
    selfie_url?: string | null
  }) => {
    if (!funcionarioId || !empresaId) {
      toast.error("Dados do funcionário não encontrados")
      return
    }

    if (state.registrando) return
    setState(prev => ({ ...prev, registrando: true }))

    try {
      const tipo = getProximoRegistro()
      const ip = await fetch("https://api.ipify.org?format=json")
        .then(r => r.json()).then(d => d.ip).catch(() => null)

      const { data, error } = await supabase
        .from("registros_ponto")
        .insert({
          funcionario_id: funcionarioId,
          empresa_id: empresaId,
          tipo,
          latitude: extraParams?.latitude || null,
          longitude: extraParams?.longitude || null,
          endereco: extraParams?.endereco || null,
          selfie_url: extraParams?.selfie_url || null,
          ip,
          dispositivo_info: navigator.userAgent,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Ponto registrado com sucesso!", {
        description: `${tipo} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      })

      await carregarRegistrosHoje()
      return data
    } catch (err: any) {
      toast.error("Erro ao registrar ponto", { description: err.message })
    } finally {
      setState(prev => ({ ...prev, registrando: false }))
    }
  }, [funcionarioId, empresaId, state.registrando, getProximoRegistro, carregarRegistrosHoje])

  return {
    ...state,
    proximoTipo: getProximoRegistro(),
    carregarRegistrosHoje,
    registrar,
  }
}
