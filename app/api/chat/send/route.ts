import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { message, session_id } = body

    if (!message || !session_id) {
      return NextResponse.json({ error: "Mensagem e session_id são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Sending message to n8n:", message)

    const webhookUrl = "https://n8n.josejusto.com.br/webhook/1bf9ddc0-47c9-4ae2-a8d7-f1c001dfd80c/chat"

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatInput: message,
        session_id: session_id,
        user_id: user.id,
      }),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error("[v0] Webhook error:", webhookResponse.status, errorText)
      return NextResponse.json({ error: "Erro ao enviar mensagem para o assistente" }, { status: 500 })
    }

    const assistantResponse = await webhookResponse.json()
    console.log("[v0] n8n response received")

    return NextResponse.json({
      success: true,
      output:
        assistantResponse.output || assistantResponse.response || "Desculpe, não consegui processar sua mensagem.",
    })
  } catch (error) {
    console.error("[v0] Error in chat send:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
