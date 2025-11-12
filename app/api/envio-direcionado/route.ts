import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { nicho, limite_mensagens, intervalo_segundos, status_filter, nicho_filter, regiao_filter } =
      await request.json()

    if (!nicho || !limite_mensagens || !intervalo_segundos) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Buscar leads filtrados
    let query = supabase.from("contatos").select("*").eq("user_id", user.id)

    if (status_filter && status_filter !== "todos") {
      query = query.eq("status", status_filter)
    }

    if (nicho_filter && nicho_filter !== "todos") {
      query = query.eq("nicho", nicho_filter)
    }

    if (regiao_filter && regiao_filter !== "todos") {
      query = query.eq("regiao", regiao_filter)
    }

    const { data: leads, error: fetchError } = await query.limit(limite_mensagens)

    if (fetchError) {
      console.error("[v0] Erro ao buscar leads:", fetchError)
      return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 })
    }

    const webhookPayload = {
      status: "pendente",
      nicho: nicho,
      limite_mensagens: Number.parseInt(limite_mensagens),
      intervalo_segundos: Number.parseInt(intervalo_segundos),
      total_leads: leads?.length || 0,
      user_id: user.id,
      regiao: regiao_filter !== "todos" ? regiao_filter : null,
    }

    console.log("[v0] Enviando para webhook:", webhookPayload)

    // Enviar para o webhook n8n
    const webhookResponse = await fetch("https://n8n.josejusto.com.br/webhook/enviodirecionado", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      console.error("[v0] Erro no webhook:", webhookResponse.status)
      return NextResponse.json({ error: "Erro ao processar envio direcionado" }, { status: 500 })
    }

    const webhookData = await webhookResponse.json()
    console.log("[v0] Resposta do webhook:", webhookData)

    // Atualizar os leads no banco com os dados retornados
    if (Array.isArray(webhookData) && webhookData.length > 0) {
      for (const leadData of webhookData) {
        if (leadData.id) {
          await supabase
            .from("contatos")
            .update({
              status: leadData.status,
              data_contato: leadData.data_contato,
            })
            .eq("id", leadData.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      leads_processados: webhookData.length || 0,
      dados: webhookData,
    })
  } catch (error) {
    console.error("[v0] Erro ao processar envio direcionado:", error)
    return NextResponse.json({ error: "Erro ao processar envio direcionado" }, { status: 500 })
  }
}
