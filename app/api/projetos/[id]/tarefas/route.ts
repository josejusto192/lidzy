import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: tarefas, error } = await supabase
      .from("projeto_tarefas")
      .select("*")
      .eq("projeto_id", params.id)
      .order("ordem", { ascending: true })

    if (error) {
      console.error("[v0] Erro ao buscar tarefas:", error)
      return NextResponse.json({ error: "Erro ao buscar tarefas" }, { status: 500 })
    }

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao buscar tarefas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
      .insert({
        projeto_id: params.id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao criar tarefa:", error)
      return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 })
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 })
  }
}
