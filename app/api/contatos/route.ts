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
      tipo_pessoa,
      nome_empresa, razao_social, nome_fantasia, nome_completo,
      cnpj, cpf, telefone, email,
      website, nicho, regiao, status, valor, notas,
      endereco, municipio, uf, cep, logradouro, numero_endereco, complemento, bairro,
      instagram_url, linkedin_url, facebook_url, site_url,
      cnae_principal, cnae_principal_descricao,
      porte_empresa, natureza_juridica, data_abertura, capital_social,
      eh_mei, optante_simples,
    } = body

    const isPF = tipo_pessoa === "fisica"
    const nomeDisplay = isPF ? (nome_completo || nome_empresa) : (nome_empresa || razao_social)

    if (!nomeDisplay) {
      return NextResponse.json({ error: isPF ? "Nome completo é obrigatório" : "Nome da empresa é obrigatório" }, { status: 400 })
    }

    const insert: Record<string, any> = {
      user_id: user.id,
      tipo_pessoa: tipo_pessoa || "juridica",
      nome_empresa: nomeDisplay,
      telefone: telefone || null,
      email: email || null,
      website: website || null,
      nicho: nicho || null,
      regiao: regiao || null,
      status: status || "pendente",
      notas: notas || null,
      endereco: endereco || null,
      municipio: municipio || null,
      uf: uf || null,
      cep: cep || null,
      logradouro: logradouro || null,
      numero_endereco: numero_endereco || null,
      complemento: complemento || null,
      bairro: bairro || null,
      instagram_url: instagram_url || null,
      linkedin_url: linkedin_url || null,
      facebook_url: facebook_url || null,
      site_url: site_url || null,
      origem: "manual",
    }

    // Campos específicos PJ
    if (!isPF) {
      insert.razao_social = razao_social || null
      insert.nome_fantasia = nome_fantasia || null
      insert.cnpj = cnpj ? cnpj.replace(/\D/g, "") : null
      insert.cnae_principal = cnae_principal || null
      insert.cnae_principal_descricao = cnae_principal_descricao || null
      insert.porte_empresa = porte_empresa || null
      insert.natureza_juridica = natureza_juridica || null
      insert.data_abertura = data_abertura || null
      insert.capital_social = capital_social ? Number(capital_social) : null
      insert.eh_mei = eh_mei ?? null
      insert.optante_simples = optante_simples ?? null
    }

    // Campos específicos PF
    if (isPF) {
      insert.nome_completo = nome_completo || null
      insert.cpf = cpf ? cpf.replace(/\D/g, "") : null
    }

    if (valor) insert.valor = Number(valor)

    const { data, error } = await supabase.from("contatos").insert(insert).select("id").single()

    if (error) {
      console.error("[contatos POST]", JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar contato" }, { status: 500 })
  }
}
