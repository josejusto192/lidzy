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

    const { data: projeto, error } = await supabase
      .from("projetos")
      .select(`
        *,
        contatos_projetos(
          contato_id,
          funcao,
          contatos(
            id,
            nome_empresa,
            email,
            telefone
          )
        )
      `)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Erro ao buscar projeto:", error)
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    return NextResponse.json(projeto)
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao buscar projeto" }, { status: 500 })
  }
}

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

    const { data: projeto, error } = await supabase
      .from("projetos")
      .update(body)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao atualizar projeto:", error)
      return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 })
    }

    return NextResponse.json(projeto)
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 })
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

    const { error } = await supabase.from("projetos").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Erro ao deletar projeto:", error)
      return NextResponse.json({ error: "Erro ao deletar projeto" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao deletar projeto" }, { status: 500 })
  }
}
