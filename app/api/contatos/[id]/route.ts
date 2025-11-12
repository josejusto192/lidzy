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

    const { id } = params

    const { data: contato, error: contatoError } = await supabase
      .from("contatos")
      .select(
        `
        *,
        contatos_tags (
          tag_id,
          tags (
            id,
            nome,
            cor
          )
        )
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (contatoError) {
      console.error("[v0] Erro ao buscar contato:", contatoError)
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    let photoUrl = null
    if (contato.telefone) {
      const { data: conversa } = await supabase
        .from("conversas")
        .select("photo")
        .eq("user_id", user.id)
        .eq("phone", contato.telefone)
        .single()

      if (conversa?.photo) {
        photoUrl = conversa.photo
      }
    }

    // Buscar projetos vinculados ao contato
    const { data: projetos, error: projetosError } = await supabase
      .from("contatos_projetos")
      .select(
        `
        funcao,
        projetos (
          id,
          nome,
          descricao,
          status,
          prioridade,
          valor_total,
          progresso,
          data_inicio,
          data_fim,
          data_entrega_prevista,
          created_at
        )
      `,
      )
      .eq("contato_id", id)

    if (projetosError) {
      console.error("[v0] Erro ao buscar projetos:", projetosError)
    }

    // Formatar tags
    const tags = contato.contatos_tags?.map((ct: any) => ct.tags).filter(Boolean) || []

    return NextResponse.json({
      contato: {
        ...contato,
        tags,
        photo: photoUrl, // Adicionar foto ao retorno
      },
      projetos: projetos?.map((p: any) => ({ ...p.projetos, funcao: p.funcao })) || [],
    })
  } catch (error) {
    console.error("[v0] Erro inesperado ao buscar contato:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar contato",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
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

    const { id } = params
    const body = await request.json()

    // Remover campos que não devem ser atualizados diretamente
    const { id: _, user_id, criado_em, ...updateData } = body

    const { data: contato, error } = await supabase
      .from("contatos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao atualizar contato:", error)
      return NextResponse.json({ error: "Erro ao atualizar contato", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ contato })
  } catch (error) {
    console.error("[v0] Erro inesperado ao atualizar contato:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar contato",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
