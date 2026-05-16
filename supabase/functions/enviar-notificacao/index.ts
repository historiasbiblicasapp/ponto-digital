import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""

serve(async (req) => {
  try {
    const { empresa_id, funcionario_id, tipo, titulo, mensagem } = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: config } = await supabase
      .from("notificacoes_config")
      .select("*")
      .eq("empresa_id", empresa_id)
      .eq("tipo", "email")
      .single()

    if (!config?.habilitado) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    const { data: func } = await supabase
      .from("funcionarios")
      .select("nome, auth_user_id")
      .eq("id", funcionario_id)
      .single()

    if (!func) {
      return new Response(JSON.stringify({ error: "Funcionario nao encontrado" }), { status: 404 })
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(func.auth_user_id)

    const email = authUser?.user?.email
    if (!email) {
      return new Response(JSON.stringify({ error: "Email nao encontrado" }), { status: 404 })
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Inter, sans-serif; background: #0a0a0f; color: #e0e0e0; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #14141f; border-radius: 16px; padding: 32px; border: 1px solid #2a2a3a;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 32px;">⏰</div>
            <h1 style="font-size: 20px; color: #ffffff; margin: 8px 0 0;">Ponto Digital BM</h1>
          </div>
          <h2 style="color: #ffffff; font-size: 18px;">${titulo}</h2>
          <p style="color: #a0a0b0; line-height: 1.6;">${mensagem}</p>
          <hr style="border: none; border-top: 1px solid #2a2a3a; margin: 24px 0;" />
          <p style="color: #606070; font-size: 12px; text-align: center;">
            Esta é uma mensagem automática do sistema Ponto Digital BM.<br/>
            Não responda este email.
          </p>
        </div>
      </body>
      </html>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ponto Digital BM <noreply@seudominio.com>",
        to: email,
        subject: titulo,
        html: emailHtml,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Resend error:", errText)
      return new Response(JSON.stringify({ error: errText }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
