import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Matches mapCnpjToLead from the working system, adapted to our schema
function mapCddItem(item: Record<string, unknown>, userId: string) {
  const sit = item.situacao_cadastral as Record<string, unknown> | null | undefined
  const porte = item.porte_empresa as Record<string, unknown> | null | undefined
  const mei = item.mei as Record<string, unknown> | null | undefined
  const simples = item.simples as Record<string, unknown> | null | undefined
  const cnae = item.atividade_principal as Record<string, unknown> | null | undefined
  const end = item.endereco as Record<string, unknown> | null | undefined
  const ibge = end?.ibge as Record<string, unknown> | null | undefined
  const emails = (item.contato_email as Record<string, unknown>[] | null | undefined) ?? []
  const tels = (item.contato_telefonico as Record<string, unknown>[] | null | undefined) ?? []
  const cnaesSecundarios =
    ((item.atividades_secundarias as unknown[])?.length ? item.atividades_secundarias :
     (item.atividade_secundaria as unknown[])?.length ? item.atividade_secundaria : null) as unknown[] | null

  const emailObj = emails[0] as Record<string, unknown> | undefined
  const tel = tels[0] as Record<string, unknown> | undefined

  let telefoneNorm: string | null = null
  if (tel?.completo) {
    const raw = String(tel.completo).replace(/\D/g, "")
    telefoneNorm = raw.length >= 10 && raw.length <= 11 ? `55${raw}` : raw.length >= 12 ? raw : null
  }

  const municipio = (end?.municipio as string) || null
  const uf = (end?.uf as string) || null

  return {
    nome_empresa: (item.nome_fantasia as string) || (item.razao_social as string) || null,
    razao_social: (item.razao_social as string) || null,
    nome_fantasia: (item.nome_fantasia as string) || null,
    cnpj: String(item.cnpj || "").replace(/\D/g, ""),
    cnpj_raiz: (item.cnpj_raiz as string) || null,
    matriz_filial: (item.matriz_filial as string) || null,
    situacao_cadastral: (sit?.situacao_atual as string) || (sit?.situacao_cadastral as string) || null,
    situacao_motivo: (sit?.motivo as string) || null,
    situacao_data: (sit?.data as string)?.slice(0, 10) || null,
    porte_empresa: (porte?.descricao as string) || null,
    porte_codigo: (porte?.codigo as string) || null,
    porte_descricao: (porte?.descricao as string) || null,
    natureza_juridica: (item.descricao_natureza_juridica as string) || null,
    natureza_juridica_codigo: (item.codigo_natureza_juridica as string) || null,
    natureza_juridica_descricao: (item.descricao_natureza_juridica as string) || null,
    qualificacao_responsavel_codigo: ((item.qualificacao_responsavel as Record<string, unknown>)?.codigo as string) || null,
    qualificacao_responsavel_descricao: ((item.qualificacao_responsavel as Record<string, unknown>)?.descricao as string) || null,
    eh_mei: (mei?.optante as boolean) || false,
    mei_data_opcao: (mei?.data_opcao_mei as string)?.slice(0, 10) || null,
    mei_data_exclusao: (mei?.data_exclusao_mei as string)?.slice(0, 10) || null,
    optante_simples: (simples?.optante as boolean) || false,
    simples_data_opcao: (simples?.data_opcao_simples as string)?.slice(0, 10) || null,
    simples_data_exclusao: (simples?.data_exclusao_simples as string)?.slice(0, 10) || null,
    nicho: (cnae?.descricao as string) || null,
    cnae_principal: (cnae?.codigo as string) || null,
    cnae_principal_codigo: (cnae?.codigo as string) || null,
    cnae_principal_descricao: (cnae?.descricao as string) || null,
    cnaes_secundarios: cnaesSecundarios?.length ? cnaesSecundarios : null,
    endereco: [end?.tipo_logradouro, end?.logradouro, end?.numero, end?.complemento, end?.bairro, municipio, uf]
      .filter(Boolean).join(", ") || null,
    regiao: municipio ? `${municipio}${uf ? ` - ${uf}` : ""}` : uf ?? null,
    cep: (end?.cep as string)?.replace(/\D/g, "") || null,
    tipo_logradouro: (end?.tipo_logradouro as string) || null,
    logradouro: (end?.logradouro as string) || null,
    numero_endereco: (end?.numero as string) || null,
    complemento: (end?.complemento as string) || null,
    bairro: (end?.bairro as string) || null,
    municipio,
    uf,
    ibge_municipio: (ibge?.codigo_municipio as number) || null,
    ibge_uf: (ibge?.codigo_uf as number) || null,
    latitude: (ibge?.latitude as number) ?? null,
    longitude: (ibge?.longitude as number) ?? null,
    telefone: telefoneNorm,
    telefone_ddd: (tel?.ddd as string) || null,
    telefone_numero: (tel?.numero as string) || null,
    telefone_tipo: (tel?.tipo as string) || null,
    email: (emailObj?.email as string) || null,
    email_valido: (emailObj?.valido as boolean) ?? null,
    email_dominio: (emailObj?.dominio as string) || (emailObj?.email as string)?.split("@")[1] || null,
    data_abertura: (item.data_abertura as string)?.slice(0, 10) || null,
    capital_social: (item.capital_social as number) || null,
    quadro_societario: (item.quadro_societario as unknown[])?.length ? item.quadro_societario : null,
    data_consulta: new Date().toISOString(),
    payload_raw: item,
    fonte_detalhes: { municipio, uf, cep: end?.cep },
    status: "novo_lead",
    origem: "casa_dos_dados",
    user_id: userId,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { items } = await request.json() as { items: Record<string, unknown>[] }
    if (!items?.length) return NextResponse.json({ error: "Nenhum item enviado" }, { status: 400 })

    // Check credits
    const { data: usuario } = await supabase.from("usuarios").select("creditos").eq("id", user.id).single()
    if (!usuario || usuario.creditos < items.length) {
      return NextResponse.json({
        error: "INSUFFICIENT_CREDITS",
        required: items.length,
        current: usuario?.creditos ?? 0,
      }, { status: 402 })
    }

    // Dedup by CNPJ
    const seenCnpj = new Set<string>()
    const mapped = items
      .map((item) => mapCddItem(item, user.id))
      .filter((l) => {
        if (!l.cnpj || seenCnpj.has(l.cnpj)) return false
        seenCnpj.add(l.cnpj)
        return true
      })

    // Check which already exist
    const cnpjs = mapped.map((l) => l.cnpj)
    const { data: existingRows } = cnpjs.length
      ? await supabase.from("contatos").select("cnpj").in("cnpj", cnpjs).eq("user_id", user.id)
      : { data: [] as { cnpj: string }[] }

    const existingCnpjs = new Set((existingRows ?? []).map((r) => r.cnpj))
    const newLeads = mapped.filter((l) => !existingCnpjs.has(l.cnpj))
    const duplicatesSkipped = mapped.length - newLeads.length

    if (newLeads.length === 0) {
      return NextResponse.json({ success: true, saved: 0, duplicatesSkipped, creditsUsed: 0 })
    }

    const { data: inserted, error: insertError } = await supabase
      .from("contatos")
      .insert(newLeads)
      .select("cnpj")

    if (insertError) {
      console.error("[cdd/salvar] insert error:", JSON.stringify(insertError))
      return NextResponse.json({ error: "Erro ao salvar contatos.", details: insertError.message }, { status: 500 })
    }

    const saved = inserted?.length ?? 0

    if (saved > 0) {
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
      await fetch(`${request.nextUrl.origin}/api/creditos/usar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          quantidade: saved,
          tipo: "uso_lead",
          descricao: `${saved} leads salvos via Receita Federal (CNPJ)`,
        }),
      })
    }

    return NextResponse.json({ success: true, saved, duplicatesSkipped, creditsUsed: saved })
  } catch (error) {
    console.error("[cdd/salvar]", error)
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 })
  }
}
