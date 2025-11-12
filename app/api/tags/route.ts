import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] API /api/tags GET - Iniciando busca de tags")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] API /api/tags GET - Usuário:", user?.id)

    if (!user) {
      console.log("[v0] API /api/tags GET - Usuário não autenticado")
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("nome", { ascending: true })

    if (error) {
      console.error("[v0] API /api/tags GET - Erro ao buscar tags:", error)
      return NextResponse.json({ error: "Erro ao buscar tags", details: error.message }, { status: 500 })
    }

    console.log("[v0] API /api/tags GET - Tags encontradas:", tags?.length || 0)
    return NextResponse.json({ tags })
  } catch (error) {
    console.error("[v0] API /api/tags GET - Erro inesperado:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar tags",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API /api/tags POST - Iniciando criação de tag")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] API /api/tags POST - Usuário:", user?.id)

    if (!user) {
      console.log("[v0] API /api/tags POST - Usuário não autenticado")
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] API /api/tags POST - Body recebido:", body)

    const { nome, cor } = body

    if (!nome) {
      console.log("[v0] API /api/tags POST - Nome não fornecido")
      return NextResponse.json({ error: "Nome da tag é obrigatório" }, { status: 400 })
    }

    console.log("[v0] API /api/tags POST - Inserindo tag no banco:", { user_id: user.id, nome, cor: cor || "#3b82f6" })

    const { data: tag, error } = await supabase
      .from("tags")
      .insert({
        user_id: user.id,
        nome,
        cor: cor || "#3b82f6",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] API /api/tags POST - Erro ao criar tag:", error)
      console.error("[v0] API /api/tags POST - Detalhes do erro:", JSON.stringify(error, null, 2))
      return NextResponse.json({ error: "Erro ao criar tag", details: error.message }, { status: 500 })
    }

    console.log("[v0] API /api/tags POST - Tag criada com sucesso:", tag)
    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error("[v0] API /api/tags POST - Erro inesperado:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar tag",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("id")

    if (!tagId) {
      return NextResponse.json({ error: "ID da tag é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("tags").delete().eq("id", tagId).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Erro ao deletar tag:", error)
      return NextResponse.json({ error: "Erro ao deletar tag", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro inesperado ao deletar tag:", error)
    return NextResponse.json(
      {
        error: "Erro ao deletar tag",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
