import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: projetos, error } = await supabase
      .from("projetos")
      .select(`
        *,
        contatos_projetos!inner(
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar projetos:", error)
      return NextResponse.json({ error: "Erro ao buscar projetos", details: error.message }, { status: 500 })
    }

    const projetosFormatados = projetos.map((projeto) => ({
      ...projeto,
      contato: projeto.contatos_projetos[0]?.contatos || null,
    }))

    return NextResponse.json(projetosFormatados)
  } catch (error) {
    console.error("[v0] Erro inesperado ao buscar projetos:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar projetos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { nome, descricao, status, prioridade, valor_total, data_inicio, data_fim_prevista, contato_id } = body

    if (!nome) {
      return NextResponse.json({ error: "Nome do projeto é obrigatório" }, { status: 400 })
    }

    if (!contato_id) {
      return NextResponse.json({ error: "Contato é obrigatório" }, { status: 400 })
    }

    const { data: projeto, error: projetoError } = await supabase
      .from("projetos")
      .insert({
        user_id: user.id,
        nome,
        descricao,
        status: status || "planejamento",
        prioridade: prioridade || "media",
        valor_total: valor_total ? Number.parseFloat(valor_total) : null,
        data_inicio: data_inicio || null,
        data_entrega_prevista: data_fim_prevista || null,
      })
      .select()
      .single()

    if (projetoError) {
      console.error("[v0] Erro ao criar projeto:", projetoError)
      return NextResponse.json({ error: "Erro ao criar projeto", details: projetoError.message }, { status: 500 })
    }

    const { error: vinculoError } = await supabase.from("contatos_projetos").insert({
      contato_id,
      projeto_id: projeto.id,
      funcao: "cliente",
    })

    if (vinculoError) {
      console.error("[v0] Erro ao vincular contato ao projeto:", vinculoError)
      // Tentar deletar o projeto criado se falhar o vínculo
      await supabase.from("projetos").delete().eq("id", projeto.id)
      return NextResponse.json({ error: "Erro ao vincular contato ao projeto" }, { status: 500 })
    }

    return NextResponse.json(projeto)
  } catch (error) {
    console.error("[v0] Erro inesperado ao criar projeto:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar projeto",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
