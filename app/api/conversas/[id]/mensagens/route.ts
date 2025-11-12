import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: conversa, error: conversaError } = await supabase
      .from("conversas")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: mensagens, error } = await supabase
      .from("mensagens")
      .select("id, message_id, from_me, message, status, timestamp")
      .eq("conversa_id", id)
      .order("timestamp", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    supabase.from("conversas").update({ unread_count: 0 }).eq("id", id).then()

    return NextResponse.json((mensagens || []).reverse())
  } catch (error) {
    console.error("[v0] Error in GET /api/conversas/[id]/mensagens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: conversa, error: conversaError } = await supabase
      .from("conversas")
      .select("phone, user_id, instancias(instance_id, token, token_seguranca)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const webhookUrl = "https://n8n.josejusto.com.br/webhook/lidzy-enviada"

    const webhookPayload = {
      phone: conversa.phone,
      message: message,
      instanceId: conversa.instancias.instance_id,
      token: conversa.instancias.token,
      tokenSeguranca: conversa.instancias.token_seguranca,
      conversaId: id,
      timestamp: Date.now(),
    }

    console.log("[v0] Sending to webhook:", webhookUrl)

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error("[v0] Webhook error:", errorText)
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
      }

      const webhookResult = await webhookResponse.json()
      console.log("[v0] Webhook response:", webhookResult)

      return NextResponse.json({ success: true, data: webhookResult })
    } catch (webhookError) {
      console.error("[v0] Webhook request failed:", webhookError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error in POST /api/conversas/[id]/mensagens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
