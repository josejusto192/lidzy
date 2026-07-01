import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Iniciando busca de contatos")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Usuário autenticado:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const nicho = searchParams.get("nicho")
    const regiao = searchParams.get("regiao")

    console.log("[v0] Filtros aplicados:", { status, nicho, regiao })

    // Excluir colunas pesadas (payload_raw, quadro_societario, cnaes_secundarios) da listagem
    let query = supabase
      .from("contatos")
      .select("id, nome_empresa, cnpj, cnpj_raiz, razao_social, nome_fantasia, telefone, email, endereco, regiao, nicho, status, origem, website, valor, criado_em, data_contato, situacao_cadastral, situacao_motivo, situacao_data, porte_empresa, natureza_juridica, cnae_principal, cnae_principal_codigo, cnae_principal_descricao, data_abertura, capital_social, eh_mei, optante_simples, matriz_filial, cep, logradouro, numero_endereco, complemento, bairro, municipio, uf, telefone_tipo, email_valido, email_dominio, instagram_url, linkedin_url, facebook_url, site_url")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false })

    if (status && status !== "todos") {
      query = query.eq("status", status)
    }

    if (nicho && nicho !== "todos") {
      query = query.eq("nicho", nicho)
    }

    if (regiao && regiao !== "todos") {
      query = query.eq("regiao", regiao)
    }

    const { data: contatos, error } = await query

    if (error) {
      console.error("[v0] Erro ao buscar contatos:", error)
      if (error.code === "PGRST205") {
        return NextResponse.json(
          {
            error: "DATABASE_NOT_SETUP",
            message: "As tabelas do banco de dados ainda não foram criadas. Execute o script SQL primeiro.",
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Erro ao buscar contatos", details: error.message }, { status: 500 })
    }

    console.log("[v0] Contatos encontrados:", contatos?.length || 0)
    return NextResponse.json({ contatos })
  } catch (error) {
    console.error("[v0] Erro inesperado ao buscar contatos:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar contatos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "ID do contato é obrigatório" }, { status: 400 })
    }

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
    const { nome_empresa, telefone, email, endereco, nicho, status, regiao } = body

    if (!nome_empresa || !telefone) {
      return NextResponse.json({ error: "Nome da empresa e telefone são obrigatórios" }, { status: 400 })
    }

    const { data: contato, error } = await supabase
      .from("contatos")
      .insert({
        user_id: user.id,
        nome_empresa,
        telefone,
        email: email || null,
        endereco: endereco || null,
        nicho: nicho || null,
        status: status || "novo",
        regiao: regiao || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao criar contato:", error)
      return NextResponse.json({ error: "Erro ao criar contato", details: error.message }, { status: 500 })
    }

    console.log("[v0] Contato criado com sucesso:", contato.id)
    return NextResponse.json(contato)
  } catch (error) {
    console.error("[v0] Erro inesperado ao criar contato:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar contato",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
