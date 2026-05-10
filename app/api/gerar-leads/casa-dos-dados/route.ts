import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// ── Tipos exatos da resposta v5 (documentação oficial) ───────────────────────

interface CddSituacaoCadastral {
  situacao_cadastral: string
  motivo?: string
  data?: string
}

interface CddPorteEmpresa {
  codigo: string
  descricao: string
}

interface CddEndereco {
  cep?: string
  tipo_logradouro?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  uf?: string
  municipio?: string
  ibge?: { codigo_municipio?: number; codigo_uf?: number; latitude?: number; longitude?: number }
}

interface CddCnpjItem {
  cnpj: string
  cnpj_raiz?: string
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: CddSituacaoCadastral
  porte_empresa?: CddPorteEmpresa
  matriz_filial?: string
  codigo_natureza_juridica?: string
  descricao_natureza_juridica?: string
  data_abertura?: string
  capital_social?: number
  endereco?: CddEndereco
  // campos presentes no tipo_resultado=completo mas não documentados formalmente
  cnae_fiscal?: string
  cnae_fiscal_descricao?: string
  // telefone/email variam conforme créditos — tratamos de forma defensiva
  telefone?: string
  ddd_telefone_1?: string
  ddd_telefone_2?: string
  email?: string
  telefones?: Array<{ ddd?: string; numero?: string; tipo?: string }>
  emails?: Array<{ email: string }>
}

interface CddResponse {
  total: number
  cnpjs: CddCnpjItem[]
}

// ── Payload de filtros recebido do frontend ──────────────────────────────────

interface CddFiltros {
  uf?: string[]
  municipio?: string[]
  bairro?: string[]
  cep?: string[]
  ddd?: string[]
  codigo_atividade_principal?: string[]
  codigo_atividade_secundaria?: string[]
  incluir_atividade_secundaria?: boolean
  codigo_natureza_juridica?: string[]
  situacao_cadastral?: string[]
  matriz_filial?: "MATRIZ" | "FILIAL"
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

// Normaliza texto para o formato que a API espera (minúsculo, sem acento)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function buildCddPayload(filtros: CddFiltros) {
  const payload: Record<string, unknown> = {
    limite: Math.min(filtros.limite ?? 100, 1000),
    pagina: filtros.pagina ?? 1,
  }

  // UF deve ser minúsculo conforme a documentação (ex: "sp", "rj")
  if (filtros.uf?.length) payload.uf = filtros.uf.map((u) => u.toLowerCase())

  // Município deve ser minúsculo e sem acentos (ex: "sao paulo")
  if (filtros.municipio?.length) payload.municipio = filtros.municipio.map(normalizeText)
  if (filtros.bairro?.length) payload.bairro = filtros.bairro.map(normalizeText)
  if (filtros.cep?.length) payload.cep = filtros.cep
  if (filtros.ddd?.length) payload.ddd = filtros.ddd

  if (filtros.codigo_atividade_principal?.length)
    payload.codigo_atividade_principal = filtros.codigo_atividade_principal

  if (filtros.codigo_atividade_secundaria?.length) {
    payload.codigo_atividade_secundaria = filtros.codigo_atividade_secundaria
    payload.incluir_atividade_secundaria = filtros.incluir_atividade_secundaria ?? true
  }

  if (filtros.codigo_natureza_juridica?.length)
    payload.codigo_natureza_juridica = filtros.codigo_natureza_juridica

  if (filtros.situacao_cadastral?.length)
    payload.situacao_cadastral = filtros.situacao_cadastral

  if (filtros.matriz_filial) payload.matriz_filial = filtros.matriz_filial

  if (filtros.porte_empresa?.length)
    payload.porte_empresa = { codigos: filtros.porte_empresa }

  if (filtros.mei_optante !== undefined)
    payload.mei = { optante: filtros.mei_optante }

  if (filtros.simples_optante !== undefined)
    payload.simples = { optante: filtros.simples_optante }

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

  // mais_filtros conforme documentação oficial
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

// Extrai telefone de várias estruturas possíveis na resposta completa
function extractPhone(item: CddCnpjItem): string | null {
  // Formato array de objetos {ddd, numero}
  if (item.telefones?.length) {
    for (const t of item.telefones) {
      const raw = `${t.ddd ?? ""}${t.numero ?? ""}`.replace(/\D/g, "")
      if (raw.length >= 10 && raw.length <= 11) return `55${raw}`
      if (raw.length >= 12 && raw.length <= 13) return raw
    }
  }
  // Formato string direta (alguns planos)
  if (item.ddd_telefone_1) {
    const raw = item.ddd_telefone_1.replace(/\D/g, "")
    if (raw.length >= 10 && raw.length <= 11) return `55${raw}`
    if (raw.length >= 12) return raw
  }
  if (item.telefone) {
    const raw = item.telefone.replace(/\D/g, "")
    if (raw.length >= 10 && raw.length <= 11) return `55${raw}`
    if (raw.length >= 12) return raw
  }
  return null
}

// Extrai email de várias estruturas possíveis
function extractEmail(item: CddCnpjItem): string | null {
  if (item.emails?.length) return item.emails[0].email
  if (item.email) return item.email
  return null
}

// Monta string de endereço a partir do objeto endereco aninhado
function buildEndereco(item: CddCnpjItem): string | null {
  const e = item.endereco
  if (!e) return null
  const parts = [e.logradouro, e.numero, e.complemento, e.bairro, e.municipio, e.uf]
    .filter(Boolean)
  return parts.length ? parts.join(", ") : null
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

    const apiKey = process.env.CASA_DOS_DADOS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "CASA_DOS_DADOS_NOT_CONFIGURED", message: "API da Casa dos Dados não configurada." },
        { status: 503 },
      )
    }

    const filtros: CddFiltros = await request.json()
    const limite = Math.min(filtros.limite ?? 100, 1000)

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("creditos")
      .eq("id", user.id)
      .single()

    if (!usuario || usuario.creditos < limite) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `Créditos insuficientes. Você precisa de aproximadamente ${limite} créditos. Saldo atual: ${usuario?.creditos || 0}.`,
          required: limite,
          current: usuario?.creditos || 0,
        },
        { status: 402 },
      )
    }

    const payload = buildCddPayload({ ...filtros, limite })

    console.log("[casa-dos-dados] Payload enviado:", JSON.stringify(payload, null, 2))

    const cddResponse = await fetch(
      "https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo",
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    if (!cddResponse.ok) {
      const text = await cddResponse.text()
      console.error(`[casa-dos-dados] API retornou ${cddResponse.status}: ${text.slice(0, 500)}`)
      return NextResponse.json(
        {
          error: cddResponse.status === 401
            ? "Chave da API inválida."
            : cddResponse.status === 403
            ? "Saldo insuficiente na Casa dos Dados."
            : "Erro ao consultar a API da Casa dos Dados.",
          details: text.slice(0, 300),
          status: cddResponse.status,
        },
        { status: 502 },
      )
    }

    const cddData: CddResponse = await cddResponse.json()
    const empresas = cddData.cnpjs || []

    console.log(`[casa-dos-dados] API retornou ${empresas.length} de ${cddData.total} total`)

    const rawLeads = empresas.map((item) => {
      // situacao_cadastral é objeto aninhado na v5
      const situacao = typeof item.situacao_cadastral === "object"
        ? item.situacao_cadastral?.situacao_cadastral
        : (item.situacao_cadastral as unknown as string) || null

      // porte_empresa é objeto aninhado na v5
      const porte = item.porte_empresa?.descricao || item.porte_empresa?.codigo || null

      const endereco = item.endereco
      const municipio = endereco?.municipio || null
      const uf = endereco?.uf || null

      return {
        nome_empresa: item.nome_fantasia || item.razao_social,
        cnpj: item.cnpj,
        telefone: extractPhone(item),
        email: extractEmail(item),
        endereco: buildEndereco(item),
        regiao: municipio ? `${municipio}${uf ? ` - ${uf.toUpperCase()}` : ""}` : uf?.toUpperCase() || null,
        nicho: item.cnae_fiscal_descricao || null,
        situacao_cadastral: situacao,
        porte_empresa: porte,
        natureza_juridica: item.descricao_natureza_juridica || null,
        cnae_principal: item.cnae_fiscal || null,
        data_abertura: item.data_abertura || null,
        capital_social: item.capital_social ?? null,
        status: "novo_lead",
        origem: "casa_dos_dados",
        user_id: user.id,
        fonte_detalhes: {
          razao_social: item.razao_social,
          cnae_descricao: item.cnae_fiscal_descricao || null,
          municipio,
          uf,
          cep: endereco?.cep || null,
          bairro: endereco?.bairro || null,
        },
      }
    })

    // Deduplicar internamente por CNPJ (prioridade) ou telefone
    const seenKeys = new Set<string>()
    const uniqueLeads = rawLeads.filter((lead) => {
      const key = lead.cnpj || lead.telefone
      if (!key || seenKeys.has(key)) return false
      seenKeys.add(key)
      return true
    })

    // Verificar duplicatas existentes no banco
    const cnpjs = uniqueLeads.map((l) => l.cnpj).filter(Boolean) as string[]
    const phones = uniqueLeads.map((l) => l.telefone).filter(Boolean) as string[]

    const [{ data: existingByCnpj }, { data: existingByPhone }] = await Promise.all([
      cnpjs.length
        ? supabase.from("contatos").select("cnpj").in("cnpj", cnpjs).eq("user_id", user.id)
        : Promise.resolve({ data: [] as { cnpj: string }[] }),
      phones.length
        ? supabase.from("contatos").select("telefone").in("telefone", phones).eq("user_id", user.id)
        : Promise.resolve({ data: [] as { telefone: string }[] }),
    ])

    const existingCnpjs = new Set(existingByCnpj?.map((c) => c.cnpj) || [])
    const existingPhones = new Set(existingByPhone?.map((c) => c.telefone) || [])

    const newLeads = uniqueLeads.filter(
      (lead) =>
        !(lead.cnpj && existingCnpjs.has(lead.cnpj)) &&
        !(lead.telefone && existingPhones.has(lead.telefone)),
    )

    const duplicatesSkipped = rawLeads.length - newLeads.length

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        totalEncontrado: cddData.total,
        leads: [],
        duplicatesSkipped,
        message: "Todos os contatos já existem no banco de dados.",
      })
    }

    const { data: insertedLeads, error: insertError } = await supabase
      .from("contatos")
      .upsert(newLeads, { onConflict: "telefone,user_id", ignoreDuplicates: true })
      .select()

    if (insertError) {
      console.error("[casa-dos-dados] Erro ao salvar:", insertError)
      return NextResponse.json({ error: "Erro ao salvar leads no banco de dados." }, { status: 500 })
    }

    const creditsUsed = insertedLeads?.length || 0

    if (creditsUsed > 0) {
      const cookieStore = await cookies()
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ")

      const creditResponse = await fetch(`${request.nextUrl.origin}/api/creditos/usar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          quantidade: creditsUsed,
          tipo: "uso_lead",
          descricao: `Geração de ${creditsUsed} leads via Casa dos Dados`,
        }),
      })

      if (!creditResponse.ok) {
        console.error("[casa-dos-dados] Erro ao descontar créditos:", await creditResponse.text())
      }
    }

    const leads = (insertedLeads || []).map((lead) => ({
      id: lead.id,
      empresa: lead.nome_empresa,
      cnpj: lead.cnpj,
      telefone: lead.telefone || "Não disponível",
      email: lead.email,
      nicho: lead.nicho,
      status: lead.status,
      endereco: lead.endereco,
      regiao: lead.regiao,
      situacao_cadastral: lead.situacao_cadastral,
      porte_empresa: lead.porte_empresa,
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
          ? `${leads.length} novos contatos salvos (${creditsUsed} créditos usados). ${duplicatesSkipped} duplicados ignorados.`
          : `${leads.length} novos contatos salvos (${creditsUsed} créditos usados).`,
    })
  } catch (error) {
    console.error("[casa-dos-dados] Erro:", error)
    return NextResponse.json({ error: "Erro ao gerar leads. Tente novamente." }, { status: 500 })
  }
}
