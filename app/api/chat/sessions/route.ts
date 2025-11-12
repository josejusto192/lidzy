import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("session_id, titulo, criado_em, atualizado_em")
      .eq("user_id", user.id)
      .order("atualizado_em", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sessions:", error)
      return NextResponse.json({ error: "Erro ao buscar sessões" }, { status: 500 })
    }

    const sessions = data.map((session) => ({
      session_id: session.session_id,
      title: session.titulo,
      last_message_at: session.atualizado_em,
      created_at: session.criado_em,
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("[v0] Error in sessions route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, title } = body

    if (!session_id) {
      return NextResponse.json({ error: "session_id é obrigatório" }, { status: 400 })
    }

    // Insert new session into database
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        session_id,
        user_id: user.id,
        titulo: title || "Nova Conversa",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating session:", error)
      return NextResponse.json({ error: "Erro ao criar sessão" }, { status: 500 })
    }

    return NextResponse.json({
      session: {
        session_id: data.session_id,
        title: data.titulo,
        created_at: data.criado_em,
        last_message_at: data.atualizado_em,
      },
    })
  } catch (error) {
    console.error("[v0] Error in create session route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, title } = body

    if (!session_id || !title) {
      return NextResponse.json({ error: "session_id e title são obrigatórios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .update({
        titulo: title,
        atualizado_em: new Date().toISOString(),
      })
      .eq("session_id", session_id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating session:", error)
      return NextResponse.json({ error: "Erro ao atualizar sessão" }, { status: 500 })
    }

    return NextResponse.json({
      session: {
        session_id: data.session_id,
        title: data.titulo,
        created_at: data.criado_em,
        last_message_at: data.atualizado_em,
      },
    })
  } catch (error) {
    console.error("[v0] Error in update session route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
