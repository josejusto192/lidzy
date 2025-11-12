import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contatoId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: tags, error } = await supabase
      .from("contatos_tags")
      .select("tag_id, tags(*)")
      .eq("contato_id", contatoId)

    if (error) {
      console.error("[v0] Erro ao buscar tags do contato:", error)
      return NextResponse.json({ error: "Erro ao buscar tags", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ tags: tags.map((t) => t.tags) })
  } catch (error) {
    console.error("[v0] Erro inesperado ao buscar tags do contato:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar tags",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contatoId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { tag_id } = body

    if (!tag_id) {
      return NextResponse.json({ error: "ID da tag é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("contatos_tags").insert({
      contato_id: contatoId,
      tag_id,
    })

    if (error) {
      console.error("[v0] Erro ao adicionar tag ao contato:", error)
      return NextResponse.json({ error: "Erro ao adicionar tag", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro inesperado ao adicionar tag:", error)
    return NextResponse.json(
      {
        error: "Erro ao adicionar tag",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contatoId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tag_id")

    if (!tagId) {
      return NextResponse.json({ error: "ID da tag é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("contatos_tags").delete().eq("contato_id", contatoId).eq("tag_id", tagId)

    if (error) {
      console.error("[v0] Erro ao remover tag do contato:", error)
      return NextResponse.json({ error: "Erro ao remover tag", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro inesperado ao remover tag:", error)
    return NextResponse.json(
      {
        error: "Erro ao remover tag",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
