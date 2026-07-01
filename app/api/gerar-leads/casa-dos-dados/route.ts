import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// ── Tipos da resposta v5 da Casa dos Dados ───────────────────────────────────

interface CddTelefone {
  ddd?: string
  numero?: string
  tipo?: string
}

interface CddCnae {
  codigo?: string
  descricao?: string
}

interface CddSocio {
  nome?: string
  cpf_cnpj_socio?: string
  qualificacao_socio?: string
  data_entrada_sociedade?: string
  pais?: string
  representante_legal?: string
  nome_representante?: string
  qualificacao_representante_legal?: string
  faixa_etaria?: string
}

interface CddItem {
  cnpj: string
  cnpj_raiz?: string
  razao_social: string
  nome_fantasia?: string
  matriz_filial?: string
  situacao_cadastral?: { situacao_cadastral?: string; motivo?: string; data?: string } | string
  porte_empresa?: { codigo?: string; descricao?: string } | string
  natureza_juridica?: { codigo?: string; descricao?: string }
  qualificacao_responsavel?: { codigo?: string; descricao?: string }
  mei?: { optante?: boolean; data_opcao?: string; data_exclusao?: string }
  simples?: { optante?: boolean; data_opcao?: string; data_exclusao?: string }
  cnae_fiscal?: string
  cnae_fiscal_descricao?: string
  cnaes_secundarios?: CddCnae[]
  endereco?: {
    cep?: string
    tipo_logradouro?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    municipio?: string
    uf?: string
    ibge?: { codigo_municipio?: number; codigo_uf?: number; latitude?: number; longitude?: number }
  }
  telefones?: CddTelefone[]
  telefone?: string
  ddd_telefone_1?: string
  emails?: Array<{ email: string; valido?: boolean; dominio?: string }>
  email?: string
  capital_social?: number
  data_abertura?: string
  data_evento?: string
  quadro_societario?: CddSocio[]
}

interface CddResponse {
  total: number
  cnpjs: CddItem[]
}

// ── Payload de filtros do frontend ───────────────────────────────────────────

interface Filtros {
  uf?: string[]
  municipio?: string[]
  bairro?: string[]
  cep?: string[]
  ddd?: string[]
  codigo_atividade_principal?: string[]
  codigo_atividade_secundaria?: string[]
  codigo_natureza_juridica?: string[]
  situacao_cadastral?: string[]
  matriz_filial?: string
  porte_empresa?: string[]
  mei_optante?: boolean
  simples_optante?: boolean
  data_abertura_inicio?: string
  data_abertura_fim?: string
  capital_social_minimo?: number
  capital_social_maximo?: number
  com_email?: boolean
  com_telefone?: boolean
  somente_celular?: boolean
  somente_fixo?: boolean
  excluir_email_contab?: boolean
  busca_textual?: string
  limite?: number
  pagina?: number
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

function buildPayload(filtros: Filtros) {
  const payload: Record<string, unknown> = {
    limite: Math.min(filtros.limite ?? 100, 1000),
    pagina: filtros.pagina ?? 1,
  }

  if (filtros.uf?.length) payload.uf = filtros.uf.map((u) => u.toLowerCase())
  if (filtros.municipio?.length) payload.municipio = filtros.municipio.map(normalizeText)
  if (filtros.bairro?.length) payload.bairro = filtros.bairro.map(normalizeText)
  if (filtros.cep?.length) payload.cep = filtros.cep
  if (filtros.ddd?.length) payload.ddd = filtros.ddd

  if (filtros.codigo_atividade_principal?.length)
    payload.codigo_atividade_principal = filtros.codigo_atividade_principal

  if (filtros.codigo_atividade_secundaria?.length) {
    payload.codigo_atividade_secundaria = filtros.codigo_atividade_secundaria
    payload.incluir_atividade_secundaria = true
  }

  if (filtros.codigo_natureza_juridica?.length)
    payload.codigo_natureza_juridica = filtros.codigo_natureza_juridica

  if (filtros.situacao_cadastral?.length)
    payload.situacao_cadastral = filtros.situacao_cadastral

  if (filtros.matriz_filial) payload.matriz_filial = filtros.matriz_filial

  if (filtros.porte_empresa?.length)
    payload.porte_empresa = { codigos: filtros.porte_empresa }

  if (filtros.mei_optante !== undefined) payload.mei = { optante: filtros.mei_optante }
  if (filtros.simples_optante !== undefined) payload.simples = { optante: filtros.simples_optante }

  if (filtros.data_abertura_inicio || filtros.data_abertura_fim) {
    payload.data_abertura = {
      ...(filtros.data_abertura_inicio && { inicio: filtros.data_abertura_inicio }),
      ...(filtros.data_abertura_fim && { fim: filtros.data_abertura_fim }),
    }
  }

  if (filtros.capital_social_minimo !== undefined || filtros.capital_social_maximo !== undefined) {
    payload.capital_social = {
      ...(filtros.capital_social_minimo !== undefined && { minimo: filtros.capital_social_minimo }),
      ...(filtros.capital_social_maximo !== undefined && { maximo: filtros.capital_social_maximo }),
    }
  }

  const maisFiltros: Record<string, boolean> = {}
  if (filtros.com_email) maisFiltros.com_email = true
  if (filtros.com_telefone) maisFiltros.com_telefone = true
  if (filtros.somente_celular) maisFiltros.somente_celular = true
  if (filtros.somente_fixo) maisFiltros.somente_fixo = true
  if (filtros.excluir_email_contab) maisFiltros.excluir_email_contab = true
  if (Object.keys(maisFiltros).length) payload.mais_filtros = maisFiltros

  if (filtros.busca_textual?.trim()) {
    payload.busca_textual = [
      {
        texto: [filtros.busca_textual.trim()],
        tipo_busca: "radical",
        razao_social: true,
        nome_fantasia: true,
      },
    ]
  }

  return payload
}

// ── Extração defensiva de dados ──────────────────────────────────────────────

function extractPhone(item: CddItem) {
  if (item.telefones?.length) {
    for (const t of item.telefones) {
      const raw = `${t.ddd ?? ""}${t.numero ?? ""}`.replace(/\D/g, "")
      if (raw.length >= 10 && raw.length <= 11) {
        return { telefone: `55${raw}`, ddd: t.ddd ?? null, numero: t.numero ?? null, tipo: t.tipo ?? null }
      }
    }
  }

  const rawStr = item.ddd_telefone_1 || item.telefone || ""
  if (rawStr) {
    const raw = rawStr.replace(/\D/g, "")
    if (raw.length >= 10 && raw.length <= 11)
      return { telefone: `55${raw}`, ddd: raw.slice(0, 2), numero: raw.slice(2), tipo: null }
    if (raw.length >= 12)
      return { telefone: raw, ddd: raw.slice(2, 4), numero: raw.slice(4), tipo: null }
  }

  return { telefone: null, ddd: null, numero: null, tipo: null }
}

function extractEmail(item: CddItem) {
  if (item.emails?.length) {
    const e = item.emails[0]
    return { email: e.email, valido: e.valido ?? null, dominio: e.dominio ?? e.email.split("@")[1] ?? null }
  }
  if (item.email) {
    return { email: item.email, valido: null, dominio: item.email.split("@")[1] ?? null }
  }
  return { email: null, valido: null, dominio: null }
}

function strSituacao(v: CddItem["situacao_cadastral"]): string | null {
  if (!v) return null
  if (typeof v === "string") return v
  return v.situacao_cadastral ?? null
}

function strPorte(v: CddItem["porte_empresa"]): { codigo: string | null; descricao: string | null } {
  if (!v) return { codigo: null, descricao: null }
  if (typeof v === "string") return { codigo: null, descricao: v }
  return { codigo: v.codigo ?? null, descricao: v.descricao ?? null }
}

function buildEndereco(item: CddItem): string | null {
  const e = item.endereco
  if (!e) return null
  return [e.logradouro, e.numero, e.complemento, e.bairro, e.municipio, e.uf].filter(Boolean).join(", ") || null
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const apiKey = process.env.CASA_DOS_DADOS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "CASA_DOS_DADOS_NOT_CONFIGURED", message: "API da Casa dos Dados não configurada." },
        { status: 503 },
      )
    }

    const filtros: Filtros = await request.json()
    const limite = Math.min(filtros.limite ?? 100, 1000)

    // Verificar créditos
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("creditos")
      .eq("id", user.id)
      .single()

    if (!usuario || usuario.creditos < limite) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `Créditos insuficientes. Você precisa de aproximadamente ${limite} créditos. Saldo atual: ${usuario?.creditos ?? 0}.`,
          required: limite,
          current: usuario?.creditos ?? 0,
        },
        { status: 402 },
      )
    }

    // Chamar API Casa dos Dados
    const payload = buildPayload({ ...filtros, limite })
    console.log("[cdd] payload →", JSON.stringify(payload))

    const cddRes = await fetch(
      "https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo",
      {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )

    if (!cddRes.ok) {
      const text = await cddRes.text()
      console.error(`[cdd] API ${cddRes.status}: ${text.slice(0, 500)}`)
      const msg =
        cddRes.status === 401 ? "Chave da API inválida." :
        cddRes.status === 403 ? "Saldo esgotado na Casa dos Dados." :
        `Erro ${cddRes.status} na API da Casa dos Dados.`
      return NextResponse.json({ error: msg, details: text.slice(0, 300) }, { status: 502 })
    }

    const cddData: CddResponse = await cddRes.json()
    const empresas = cddData.cnpjs ?? []
    console.log(`[cdd] recebidos ${empresas.length} de ${cddData.total}`)

    // Mapear para o schema rico de contatos
    const rawLeads = empresas.map((item) => {
      const { telefone, ddd, numero: telNum, tipo: telTipo } = extractPhone(item)
      const { email, valido: emailValido, dominio: emailDominio } = extractEmail(item)
      const situacao = strSituacao(item.situacao_cadastral)
      const porte = strPorte(item.porte_empresa)
      const endereco = item.endereco
      const municipio = endereco?.municipio ?? null
      const uf = endereco?.uf ?? null

      return {
        // Campos existentes (backward compat)
        nome_empresa: item.nome_fantasia || item.razao_social,
        cnpj: item.cnpj,
        telefone,
        email,
        endereco: buildEndereco(item),
        regiao: municipio ? `${municipio}${uf ? ` - ${uf.toUpperCase()}` : ""}` : uf?.toUpperCase() ?? null,
        nicho: item.cnae_fiscal_descricao ?? null,
        situacao_cadastral: situacao,
        porte_empresa: porte.descricao,
        natureza_juridica: item.natureza_juridica?.descricao ?? null,
        cnae_principal: item.cnae_fiscal ?? null,
        data_abertura: item.data_abertura ?? null,
        capital_social: item.capital_social ?? null,
        status: "novo_lead",
        origem: "casa_dos_dados",
        user_id: user.id,

        // Campos ricos
        cnpj_raiz: item.cnpj_raiz ?? null,
        razao_social: item.razao_social ?? null,
        nome_fantasia: item.nome_fantasia ?? null,
        matriz_filial: item.matriz_filial ?? null,
        situacao_motivo: typeof item.situacao_cadastral === "object" ? item.situacao_cadastral?.motivo ?? null : null,
        situacao_data: typeof item.situacao_cadastral === "object" ? item.situacao_cadastral?.data ?? null : null,
        porte_codigo: porte.codigo,
        porte_descricao: porte.descricao,
        natureza_juridica_codigo: item.natureza_juridica?.codigo ?? null,
        natureza_juridica_descricao: item.natureza_juridica?.descricao ?? null,
        qualificacao_responsavel_codigo: item.qualificacao_responsavel?.codigo ?? null,
        qualificacao_responsavel_descricao: item.qualificacao_responsavel?.descricao ?? null,
        eh_mei: item.mei?.optante ?? false,
        mei_data_opcao: item.mei?.data_opcao ?? null,
        mei_data_exclusao: item.mei?.data_exclusao ?? null,
        optante_simples: item.simples?.optante ?? false,
        simples_data_opcao: item.simples?.data_opcao ?? null,
        simples_data_exclusao: item.simples?.data_exclusao ?? null,
        cnae_principal_codigo: item.cnae_fiscal ?? null,
        cnae_principal_descricao: item.cnae_fiscal_descricao ?? null,
        cnaes_secundarios: item.cnaes_secundarios?.length ? item.cnaes_secundarios : null,
        cep: endereco?.cep ?? null,
        tipo_logradouro: endereco?.tipo_logradouro ?? null,
        logradouro: endereco?.logradouro ?? null,
        numero_endereco: endereco?.numero ?? null,
        complemento: endereco?.complemento ?? null,
        bairro: endereco?.bairro ?? null,
        municipio,
        uf,
        ibge_municipio: endereco?.ibge?.codigo_municipio ?? null,
        ibge_uf: endereco?.ibge?.codigo_uf ?? null,
        latitude: endereco?.ibge?.latitude ?? null,
        longitude: endereco?.ibge?.longitude ?? null,
        telefone_ddd: ddd,
        telefone_numero: telNum,
        telefone_tipo: telTipo,
        email_valido: emailValido,
        email_dominio: emailDominio,
        quadro_societario: item.quadro_societario?.length ? item.quadro_societario : null,
        data_evento: item.data_evento ?? null,
        data_consulta: new Date().toISOString(),
        payload_raw: item as unknown as Record<string, unknown>,
      }
    })

    // Deduplicar por CNPJ
    const seenCnpj = new Set<string>()
    const uniqueLeads = rawLeads.filter((l) => {
      if (!l.cnpj || seenCnpj.has(l.cnpj)) return false
      seenCnpj.add(l.cnpj)
      return true
    })

    // Checar duplicatas no banco
    const cnpjs = uniqueLeads.map((l) => l.cnpj).filter(Boolean) as string[]
    const { data: existingRows } = cnpjs.length
      ? await supabase.from("contatos").select("cnpj").in("cnpj", cnpjs).eq("user_id", user.id)
      : { data: [] as { cnpj: string }[] }

    const existingCnpjs = new Set((existingRows ?? []).map((r) => r.cnpj))
    const newLeads = uniqueLeads.filter((l) => !existingCnpjs.has(l.cnpj))
    const duplicatesSkipped = rawLeads.length - newLeads.length

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        totalEncontrado: cddData.total,
        leads: [],
        duplicatesSkipped,
        creditsUsed: 0,
        message: "Todos os contatos já existem no banco de dados.",
      })
    }

    const { data: inserted, error: insertError } = await supabase
      .from("contatos")
      .upsert(newLeads, { onConflict: "cnpj,user_id", ignoreDuplicates: true })
      .select()

    if (insertError) {
      console.error("[cdd] upsert error:", insertError)
      return NextResponse.json({ error: "Erro ao salvar leads no banco de dados." }, { status: 500 })
    }

    const creditsUsed = inserted?.length ?? 0

    // Descontar créditos
    if (creditsUsed > 0) {
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
      await fetch(`${request.nextUrl.origin}/api/creditos/usar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          quantidade: creditsUsed,
          tipo: "uso_lead",
          descricao: `${creditsUsed} leads gerados via Receita Federal (CNPJ)`,
        }),
      })
    }

    const leads = (inserted ?? []).map((l) => ({
      id: l.id,
      empresa: l.nome_empresa,
      cnpj: l.cnpj,
      telefone: l.telefone ?? "Não disponível",
      email: l.email,
      nicho: l.nicho,
      status: l.status,
      endereco: l.endereco,
      regiao: l.regiao,
      situacao_cadastral: l.situacao_cadastral,
      porte_empresa: l.porte_empresa,
    }))

    return NextResponse.json({
      success: true,
      total: leads.length,
      totalEncontrado: cddData.total,
      leads,
      duplicatesSkipped,
      creditsUsed,
      message:
        duplicatesSkipped > 0
          ? `${leads.length} novos contatos salvos (${creditsUsed} créditos). ${duplicatesSkipped} duplicados ignorados.`
          : `${leads.length} novos contatos salvos (${creditsUsed} créditos).`,
    })
  } catch (error) {
    console.error("[cdd] erro:", error)
    return NextResponse.json({ error: "Erro ao gerar leads. Tente novamente." }, { status: 500 })
  }
}
