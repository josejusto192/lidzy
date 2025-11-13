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

    // Buscar conversa com dados da instância Evolution API
    const { data: conversa, error: conversaError } = await supabase
      .from("conversas")
      .select(`
        phone,
        user_id,
        instancias(
          id,
          instance_id,
          api_url,
          api_key
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (conversaError || !conversa || !conversa.instancias) {
      console.error("[Send Message] Conversa not found:", conversaError)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { instance_id, api_url, api_key } = conversa.instancias

    // Usar Evolution API URL padrão se não tiver configurado
    const evolutionApiUrl = api_url || process.env.EVOLUTION_API_URL || "http://31.97.24.93:7458"
    const evolutionApiKey = api_key || process.env.EVOLUTION_API_KEY || "jose1234"

    console.log("[Send Message] Sending via Evolution API:", {
      instanceId: instance_id,
      phone: conversa.phone,
      messageLength: message.length,
    })

    // Enviar mensagem via Evolution API
    const cleanPhone = conversa.phone.replace(/[^0-9]/g, '')

    try {
      const response = await fetch(`${evolutionApiUrl}/message/sendText/${instance_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolutionApiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Send Message] Evolution API error:", errorText)
        return NextResponse.json({ error: "Failed to send message via Evolution API" }, { status: 500 })
      }

      const result = await response.json()
      console.log("[Send Message] Evolution API response:", result)

      const messageId = result.key?.id || result.messageId || `msg-${Date.now()}`

      // Salvar mensagem no banco de dados
      const { error: insertError } = await supabase.from("mensagens").insert({
        conversa_id: id,
        message_id: messageId,
        from_me: true,
        message: message,
        status: "sent",
        timestamp: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[Send Message] Error saving message:", insertError)
      }

      // Atualizar última mensagem da conversa
      await supabase
        .from("conversas")
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      return NextResponse.json({ success: true, messageId: messageId, data: result })
    } catch (apiError) {
      console.error("[Send Message] Evolution API request failed:", apiError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Send Message] Error in POST /api/conversas/[id]/mensagens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
