import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const nicho = searchParams.get("nicho")
    const regiao = searchParams.get("regiao")

    let query = supabase
      .from("contatos")
      .select("id, nome_empresa, cnpj, cnpj_raiz, razao_social, nome_fantasia, telefone, email, endereco, regiao, nicho, status, origem, website, valor, criado_em, data_contato, situacao_cadastral, situacao_motivo, situacao_data, porte_empresa, natureza_juridica, cnae_principal, cnae_principal_codigo, cnae_principal_descricao, data_abertura, capital_social, eh_mei, optante_simples, matriz_filial, cep, logradouro, numero_endereco, complemento, bairro, municipio, uf, telefone_tipo, email_valido, email_dominio, instagram_url, linkedin_url, facebook_url, site_url")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false })

    if (status) query = query.eq("status", status)
    if (nicho) query = query.eq("nicho", nicho)
    if (regiao) query = query.eq("regiao", regiao)

    const { data: contatos, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ contatos })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contatos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await request.json()

    const {
      nome_empresa, razao_social, nome_fantasia, cnpj, telefone, email,
      website, nicho, regiao, status, valor, notas,
      endereco, municipio, uf, cep, logradouro, numero_endereco, complemento, bairro,
      instagram_url, linkedin_url, facebook_url, site_url,
      cnae_principal, cnae_principal_descricao,
      porte_empresa, natureza_juridica, data_abertura, capital_social,
      eh_mei, optante_simples,
    } = body

    if (!nome_empresa && !razao_social) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("contatos")
      .insert({
        user_id: user.id,
        nome_empresa: nome_empresa || razao_social,
        razao_social,
        nome_fantasia,
        cnpj: cnpj?.replace(/\D/g, "") || null,
        telefone,
        email,
        website,
        nicho,
        regiao,
        status: status || "pendente",
        valor,
        notas,
        endereco,
        municipio,
        uf,
        cep,
        logradouro,
        numero_endereco,
        complemento,
        bairro,
        instagram_url,
        linkedin_url,
        facebook_url,
        site_url,
        cnae_principal,
        cnae_principal_descricao,
        porte_empresa,
        natureza_juridica,
        data_abertura: data_abertura || null,
        capital_social: capital_social || null,
        eh_mei: eh_mei ?? null,
        optante_simples: optante_simples ?? null,
        origem: "manual",
      })
      .select("id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar contato" }, { status: 500 })
  }
}
