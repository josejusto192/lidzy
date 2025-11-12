import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()

    const { data: tarefa, error } = await supabase
      .from("projeto_tarefas")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao atualizar tarefa:", error)
      return NextResponse.json({ error: "Erro ao atualizar tarefa" }, { status: 500 })
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao atualizar tarefa" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { error } = await supabase.from("projeto_tarefas").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Erro ao deletar tarefa:", error)
      return NextResponse.json({ error: "Erro ao deletar tarefa" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao deletar tarefa" }, { status: 500 })
  }
}
