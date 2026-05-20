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
    const { name, slug, razao_social, nome_fantasia, cnpj, email, telefone, plano, limite_funcionarios, primary_color } = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name, slug,
        razao_social: razao_social || null,
        nome_fantasia: nome_fantasia || null,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
        plano: plano || "basico",
        limite_funcionarios: limite_funcionarios || 10,
        active: true,
        primary_color: primary_color || "#16a34a",
      })
      .select()
      .single()

    if (tenantError) {
      return new Response(JSON.stringify({ error: "Erro ao criar tenant: " + tenantError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const adminEmail = email || `${slug}@admin.pontodigital.com`
    const adminPassword = "admin123"

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { tenant_id: tenant.id, role: "admin" },
    })

    if (authError) {
      await supabase.from("tenants").delete().eq("id", tenant.id)
      return new Response(JSON.stringify({ error: "Erro ao criar usuário admin: " + authError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const { error: linkError } = await supabase.from("tenant_users").insert({
      tenant_id: tenant.id,
      email: adminEmail,
      role: "admin",
      active: true,
    })

    if (linkError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from("tenants").delete().eq("id", tenant.id)
      return new Response(JSON.stringify({ error: "Erro ao vincular admin: " + linkError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({
      tenant,
      adminEmail,
      adminPassword,
      message: `Empresa criada! Admin: ${adminEmail}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})