import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ativo } = body

    if (!id || ativo === undefined) {
      return NextResponse.json({ error: "ID e status são obrigatórios" }, { status: 400 })
    }

    if (ativo) {
      const { data: agent, error: fetchError } = await supabase
        .from("agentes_prospeccao")
        .select("instancia_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (fetchError || !agent) {
        return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
      }

      if (!agent.instancia_id) {
        return NextResponse.json(
          { error: "Não é possível ativar um agente sem uma instância associada" },
          { status: 400 },
        )
      }
    }

    const { data: agente, error } = await supabase
      .from("agentes_prospeccao")
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error toggling agent status:", error)
      return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
    }

    return NextResponse.json({ agente })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/agentes/toggle:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
