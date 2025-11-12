import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get("session_id")

    if (!session_id) {
      return NextResponse.json({ error: "session_id é obrigatório" }, { status: 400 })
    }

    console.log("[v0] Fetching chat history for session:", session_id)

    const { data, error } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .eq("session_id", session_id)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching chat history:", error)
      return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 })
    }

    const messages = (data || []).map((item) => {
      let parsedMessage
      try {
        parsedMessage = typeof item.message === "string" ? JSON.parse(item.message) : item.message
      } catch (e) {
        console.error("[v0] Error parsing message:", e)
        parsedMessage = { type: "human", content: item.message }
      }

      return {
        id: item.id,
        message: {
          role: parsedMessage.type === "ai" ? "assistant" : "user",
          content: parsedMessage.content || "",
        },
        timestamp: item.timestamp,
      }
    })

    console.log("[v0] Parsed messages:", messages.length)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error in history route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
