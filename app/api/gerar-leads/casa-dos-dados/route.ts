import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// ── Tipos da resposta v5 ──────────────────────────────────────────────────────

interface CddTelefone {
  completo?: string
  ddd?: string
  numero?: string
  tipo?: string // "CELULAR" | "FIXO"
}

interface CddEmail {
  email: string
  valido?: boolean
  dominio?: string
}

interface CddCnae {
  codigo?: string
  descricao?: string
}

interface CddSocio {
  nome?: string
  qualificacao?: string
  data_entrada?: string
  cpf_cnpj?: string
}

interface CddItem {
  cnpj: string
  cnpj_raiz?: string
  razao_social: string
  nome_fantasia?: string
  matriz_filial?: string
  situacao_cadastral?: { situacao_atual?: string; motivo?: string; data?: string }
  porte_empresa?: { codigo?: string; descricao?: string }
  codigo_natureza_juridica?: string
  descricao_natureza_juridica?: string
  qualificacao_responsavel?: { codigo?: string; descricao?: string }
  mei?: { optante?: boolean; data_opcao_mei?: string; data_exclusao_mei?: string }
  simples?: { optante?: boolean; data_opcao_simples?: string; data_exclusao_simples?: string }
  atividade_principal?: CddCnae
  atividade_secundaria?: CddCnae[]
  atividades_secundarias?: CddCnae[] // alias que alguns endpoints retornam
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
  contato_email?: CddEmail[]
  contato_telefonico?: CddTelefone[]
  capital_social?: number
  data_abertura?: string
  data_consulta?: string
  quadro_societario?: CddSocio[]
}

interface CddResponse {
  cnpjs: CddItem[]
  total: number
}

// ── Filtros do frontend ───────────────────────────────────────────────────────

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
}

const CDD_PAGE_SIZE = 20
const CDD_URL = "https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo"

function stripCnae(c: string) { return c.replace(/[-/]/g, "") }

function buildPayload(filtros: Filtros, pagina: number) {
  const payload: Record<string, unknown> = {
    limite: CDD_PAGE_SIZE,
    pagina,
  }

  // UF e município DEVEM ser lowercase
  if (filtros.uf?.length) payload.uf = filtros.uf.map((u) => u.toLowerCase())
  if (filtros.municipio?.length) payload.municipio = filtros.municipio.map((m) => m.toLowerCase())
  if (filtros.bairro?.length) payload.bairro = filtros.bairro.map((b) => b.toLowerCase())
  if (filtros.cep?.length) payload.cep = filtros.cep.map((c) => c.replace(/\D/g, ""))
  if (filtros.ddd?.length) payload.ddd = filtros.ddd

  // CNAE sem traço/barra
  if (filtros.codigo_atividade_principal?.length)
    payload.codigo_atividade_principal = filtros.codigo_atividade_principal.map(stripCnae)

  if (filtros.codigo_atividade_secundaria?.length) {
    payload.codigo_atividade_secundaria = filtros.codigo_atividade_secundaria.map(stripCnae)
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
    payload.busca_textual = [{
      texto: [filtros.busca_textual.trim()],
      tipo_busca: "radical",
      razao_social: true,
      nome_fantasia: true,
      nome_socio: false,
    }]
  }

  return payload
}

// ── Mapeamento dos campos conforme documentação oficial ───────────────────────
// Só insere colunas que existem na tabela base. Todos os dados ricos ficam
// também em fonte_detalhes (json) para não depender da migration ter sido rodada.

function mapItem(item: CddItem, userId: string) {
  const tel = item.contato_telefonico?.[0]
  const emailObj = item.contato_email?.[0]
  const cnae = item.atividade_principal
  const cnaesSecundarios = item.atividade_secundaria ?? item.atividades_secundarias ?? []
  const situacao = item.situacao_cadastral
  const endereco = item.endereco
  const municipio = endereco?.municipio ?? null
  const uf = endereco?.uf ?? null

  let telefoneNorm: string | null = null
  if (tel?.completo) {
    const raw = tel.completo.replace(/\D/g, "")
    telefoneNorm = raw.length >= 10 && raw.length <= 11 ? `55${raw}` : raw.length >= 12 ? raw : null
  }

  return {
    // Colunas que existem na tabela atual (sem depender da migration)
    nome_empresa: item.nome_fantasia || item.razao_social,
    cnpj: item.cnpj.replace(/\D/g, ""),
    telefone: telefoneNorm,
    email: emailObj?.email ?? null,
    endereco: [endereco?.logradouro, endereco?.numero, endereco?.complemento, endereco?.bairro, municipio, uf]
      .filter(Boolean).join(", ") || null,
    regiao: municipio ? `${municipio}${uf ? ` - ${uf}` : ""}` : uf ?? null,
    nicho: cnae?.descricao ?? null,
    situacao_cadastral: situacao?.situacao_atual ?? null,
    porte_empresa: item.porte_empresa?.descricao ?? null,
    natureza_juridica: item.descricao_natureza_juridica ?? null,
    cnae_principal: cnae?.codigo ?? null,
    data_abertura: item.data_abertura?.slice(0, 10) ?? null,
    capital_social: item.capital_social ?? null,
    status: "novo_lead",
    origem: "casa_dos_dados",
    user_id: userId,
    // Todos os dados ricos ficam em fonte_detalhes até a migration ser rodada
    fonte_detalhes: {
      razao_social: item.razao_social,
      cnpj_raiz: item.cnpj_raiz,
      matriz_filial: item.matriz_filial,
      situacao_motivo: situacao?.motivo,
      situacao_data: situacao?.data,
      porte_codigo: item.porte_empresa?.codigo,
      natureza_juridica_codigo: item.codigo_natureza_juridica,
      qualificacao_responsavel: item.qualificacao_responsavel,
      eh_mei: item.mei?.optante ?? false,
      mei_data_opcao: item.mei?.data_opcao_mei,
      optante_simples: item.simples?.optante ?? false,
      simples_data_opcao: item.simples?.data_opcao_simples,
      cnaes_secundarios: cnaesSecundarios,
      cep: endereco?.cep,
      bairro: endereco?.bairro,
      municipio,
      uf,
      ibge: endereco?.ibge,
      telefone_ddd: tel?.ddd,
      telefone_tipo: tel?.tipo,
      email_valido: emailObj?.valido,
      email_dominio: emailObj?.dominio ?? emailObj?.email?.split("@")[1],
      quadro_societario: item.quadro_societario,
      data_consulta: new Date().toISOString(),
      payload_raw: item,
    },
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
    // Máximo de 100 por requisição (5 páginas × 20) para não estourar o timeout do serverless
    const limiteDesejado = Math.min(filtros.limite ?? 100, 100)

    // Verificar créditos
    const { data: usuario } = await supabase
      .from("usuarios").select("creditos").eq("id", user.id).single()

    if (!usuario || usuario.creditos < limiteDesejado) {
      return NextResponse.json({
        error: "INSUFFICIENT_CREDITS",
        message: `Créditos insuficientes. Você precisa de aproximadamente ${limiteDesejado} créditos. Saldo atual: ${usuario?.creditos ?? 0}.`,
        required: limiteDesejado,
        current: usuario?.creditos ?? 0,
      }, { status: 402 })
    }

    // ── Paginação: a API retorna no máx. 20 por página ────────────────────────
    const pagesNeeded = Math.ceil(limiteDesejado / CDD_PAGE_SIZE)
    const allItems: CddItem[] = []
    let totalEncontrado = 0

    for (let page = 1; page <= pagesNeeded; page++) {
      const payload = buildPayload(filtros, page)
      console.log(`[cdd] página ${page}/${pagesNeeded}`, JSON.stringify(payload))

      const cddRes = await fetch(CDD_URL, {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!cddRes.ok) {
        const text = await cddRes.text()
        console.error(`[cdd] API ${cddRes.status} p${page}: ${text.slice(0, 300)}`)
        const msg =
          cddRes.status === 401 ? "Chave da API inválida." :
          cddRes.status === 403 ? "Saldo esgotado na Casa dos Dados." :
          `Erro ${cddRes.status} na API da Casa dos Dados.`
        return NextResponse.json({ error: msg, details: text.slice(0, 300) }, { status: 502 })
      }

      const data: CddResponse = await cddRes.json()
      totalEncontrado = data.total
      allItems.push(...(data.cnpjs ?? []))

      // Para se já coletamos o suficiente ou não há mais páginas
      if (allItems.length >= limiteDesejado || allItems.length >= data.total) break

      // Pausa entre páginas para não estourar rate limit
      if (page < pagesNeeded) await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[cdd] coletados ${allItems.length} de ${totalEncontrado} total`)

    // Mapear e deduplicar por CNPJ
    const seenCnpj = new Set<string>()
    const uniqueLeads = allItems
      .slice(0, limiteDesejado)
      .map((item) => mapItem(item, user.id))
      .filter((l) => {
        if (!l.cnpj || seenCnpj.has(l.cnpj)) return false
        seenCnpj.add(l.cnpj)
        return true
      })

    // Checar duplicatas no banco
    const cnpjs = uniqueLeads.map((l) => l.cnpj)
    const { data: existingRows } = cnpjs.length
      ? await supabase.from("contatos").select("cnpj").in("cnpj", cnpjs).eq("user_id", user.id)
      : { data: [] as { cnpj: string }[] }

    const existingCnpjs = new Set((existingRows ?? []).map((r) => r.cnpj))
    const newLeads = uniqueLeads.filter((l) => !existingCnpjs.has(l.cnpj))
    const duplicatesSkipped = uniqueLeads.length - newLeads.length

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true, total: 0, totalEncontrado, leads: [],
        duplicatesSkipped, creditsUsed: 0,
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
      totalEncontrado,
      leads,
      duplicatesSkipped,
      creditsUsed,
      message: duplicatesSkipped > 0
        ? `${leads.length} novos contatos salvos (${creditsUsed} créditos). ${duplicatesSkipped} duplicados ignorados.`
        : `${leads.length} novos contatos salvos (${creditsUsed} créditos).`,
    })
  } catch (error) {
    console.error("[cdd] erro:", error)
    return NextResponse.json({ error: "Erro ao gerar leads. Tente novamente." }, { status: 500 })
  }
}
