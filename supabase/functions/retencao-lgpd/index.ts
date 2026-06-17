import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: policies, error: polError } = await supabase
      .from("politica_retencao")
      .select("*")
      .eq("ativo", true)

    if (polError) throw polError
    if (!policies || policies.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma política ativa encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    const resultados: string[] = []
    for (const policy of policies) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - (policy.dias_retencao || 1825))
      const dataLimiteStr = dataLimite.toISOString()

      if (policy.tabela === "registros_ponto") {
        if (policy.acao === "delete") {
          const { data, error } = await supabase
            .from("registros_ponto")
            .delete()
            .eq("empresa_id", policy.empresa_id)
            .lt("data_hora", dataLimiteStr)
          if (error) throw error
          resultados.push(`Excluídos ${data?.length || 0} registros_ponto da empresa ${policy.empresa_id}`)
        } else if (policy.acao === "anonymize") {
          const { data, error } = await supabase
            .from("funcionarios")
            .update({
              nome: "[ANONIMIZADO]",
              cpf: null,
              email: null,
              telefone: null,
              rg: null,
              foto_url: null,
            })
            .eq("empresa_id", policy.empresa_id)
            .lt("created_at", dataLimiteStr)
          if (error) throw error
          resultados.push(`Anonimizados ${data?.length || 0} funcionários da empresa ${policy.empresa_id}`)
        }
      }

      if (policy.tabela === "funcionarios" && policy.acao === "delete") {
        const { data, error } = await supabase
          .from("funcionarios")
          .delete()
          .eq("empresa_id", policy.empresa_id)
          .eq("ativo", false)
          .lt("updated_at", dataLimiteStr)
        if (error) throw error
        resultados.push(`Excluídos ${data?.length || 0} funcionários inativos da empresa ${policy.empresa_id}`)
      }

      if (policy.tabela === "consentimentos_lgpd" && policy.acao === "delete") {
        const { data, error } = await supabase
          .from("consentimentos_lgpd")
          .delete()
          .eq("empresa_id", policy.empresa_id)
          .lt("created_at", dataLimiteStr)
        if (error) throw error
        resultados.push(`Excluídos ${data?.length || 0} consentimentos da empresa ${policy.empresa_id}`)
      }
    }

    return new Response(JSON.stringify({
      message: "Retenção executada",
      resultados,
      total: resultados.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
