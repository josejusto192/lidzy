import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { instanceName } = body

    if (!instanceName) {
      return NextResponse.json({ error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Configurações da Evolution API (devem vir de variáveis de ambiente)
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "http://31.97.24.93:7458"
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "jose1234"
    const webhookUrl = process.env.EVOLUTION_WEBHOOK_URL || "https://n8n.josejusto.com.br/webhook/lidzy-evo"

    console.log("[v0] Criando instância Evolution API:", instanceName)
    console.log("[v0] Evolution API URL:", evolutionApiUrl)
    console.log("[v0] Evolution API Key:", evolutionApiKey.substring(0, 4) + "****")
    console.log("[v0] Webhook URL:", webhookUrl)

    const payload = {
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        url: webhookUrl,
        by_events: true,
        base64: true,
        events: ["MESSAGES_UPSERT"],
      },
    }

    console.log("[v0] Payload para Evolution API:", JSON.stringify(payload, null, 2))

    // Criar instância na Evolution API
    const response = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] Status da resposta Evolution API:", response.status)
    console.log("[v0] Headers da resposta:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("[v0] Resposta da Evolution API (texto):", responseText)

    if (
      responseText.includes("Invalid request") ||
      responseText.includes("Error") ||
      responseText.includes("error") ||
      responseText.includes("only https is supported")
    ) {
      console.error("[v0] Erro detectado na resposta:", responseText)
      return NextResponse.json(
        {
          error: "Erro ao criar instância na Evolution API",
          details: responseText,
          status: response.status,
          hint: responseText.includes("only https is supported")
            ? "A Evolution API requer que a URL da API use HTTPS. Verifique a configuração do servidor Evolution API."
            : undefined,
        },
        { status: 400 },
      )
    }

    let evolutionData
    try {
      evolutionData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Erro ao fazer parse da resposta:", parseError)
      return NextResponse.json(
        {
          error: "Resposta inválida da Evolution API",
          details: responseText,
          status: response.status,
        },
        { status: 500 },
      )
    }

    if (!response.ok) {
      console.error("[v0] Erro ao criar instância na Evolution API:", evolutionData)
      return NextResponse.json(
        {
          error: "Erro ao criar instância na Evolution API",
          details: evolutionData,
          status: response.status,
        },
        { status: response.status },
      )
    }

    console.log("[v0] Instância criada na Evolution API:", evolutionData)

    // Salvar instância no banco de dados
    const { data: instancia, error } = await supabase
      .from("instancias")
      .insert({
        user_id: user.id,
        nome: instanceName,
        tipo: "Evolution API",
        instance_id: instanceName,
        token: evolutionApiKey,
        token_seguranca: evolutionData.hash || "",
        ativo: false, // Começa inativo até conectar o WhatsApp
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao salvar instância no banco:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      instancia,
      evolutionData,
      qrcode: evolutionData.qrcode,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao criar instância Evolution:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
