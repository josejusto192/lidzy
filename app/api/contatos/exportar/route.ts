import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Converte array de objetos para CSV
function toCSV(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""')
    return /[",\n\r]/.test(s) ? `"${s}"` : s
  }
  const headerLine = headers.map((h) => escape(h.label)).join(",")
  const lines = rows.map((row) => headers.map((h) => escape(row[h.key])).join(","))
  return [headerLine, ...lines].join("\r\n")
}

// Formata CSV para lookalike do Facebook
function toLookalikeCSV(rows: Record<string, unknown>[]): string {
  const headers = [
    { key: "email", label: "email" },
    { key: "phone", label: "phone" },
    { key: "fn", label: "fn" },
    { key: "ln", label: "ln" },
    { key: "ct", label: "ct" },
    { key: "st", label: "st" },
    { key: "zp", label: "zp" },
    { key: "country", label: "country" },
  ]

  const mapped = rows.map((c) => {
    const nomeCompleto = String(c.nome_empresa ?? "").trim()
    const partes = nomeCompleto.split(" ")
    const fn = partes[0] ?? ""
    const ln = partes.slice(1).join(" ") || ""

    // Telefone já deve estar no formato 55DDDNUMERO
    const phone = String(c.telefone ?? "").replace(/\D/g, "") || ""

    const fonteDetalhes = (c.fonte_detalhes as Record<string, unknown>) ?? {}
    const municipio = String(c.municipio ?? fonteDetalhes.municipio ?? "").trim()
    const uf = String(c.uf ?? fonteDetalhes.uf ?? "").toLowerCase()
    const cep = String(c.cep ?? fonteDetalhes.cep ?? "").replace(/\D/g, "")

    return {
      email: c.email ?? "",
      phone,
      fn,
      ln,
      ct: municipio,
      st: uf,
      zp: cep,
      country: "BR",
    }
  })

  return toCSV(mapped, headers)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await request.json()
    const {
      formato = "csv",        // "csv" | "lookalike"
      // Filtros
      status,
      origem,
      nicho,
      regiao,
      situacao_cadastral,
      com_telefone,
      com_email,
      limite = 5000,
    } = body

    let query = supabase
      .from("contatos")
      .select("nome_empresa, razao_social, cnpj, cnpj_raiz, telefone, email, endereco, regiao, nicho, situacao_cadastral, situacao_motivo, porte_empresa, natureza_juridica, cnae_principal, cnae_principal_descricao, cnaes_secundarios, data_abertura, capital_social, status, origem, cep, logradouro, numero_endereco, complemento, bairro, municipio, uf, eh_mei, optante_simples, matriz_filial, email_valido, email_dominio, telefone_tipo, fonte_detalhes")
      .eq("user_id", user.id)
      .limit(Math.min(Number(limite), 10000))

    if (status) query = query.eq("status", status)
    if (origem) query = query.eq("origem", origem)
    if (nicho) query = query.ilike("nicho", `%${nicho}%`)
    if (regiao) query = query.ilike("regiao", `%${regiao}%`)
    if (situacao_cadastral) query = query.eq("situacao_cadastral", situacao_cadastral)
    if (com_telefone) query = query.not("telefone", "is", null)
    if (com_email) query = query.not("email", "is", null)

    const { data: contatos, error } = await query

    if (error) {
      console.error("[exportar] query error:", error)
      return NextResponse.json({ error: "Erro ao buscar contatos" }, { status: 500 })
    }

    const rows = (contatos ?? []) as Record<string, unknown>[]

    let csv: string
    let filename: string

    if (formato === "lookalike") {
      csv = toLookalikeCSV(rows)
      filename = `lookalike_${new Date().toISOString().slice(0, 10)}.csv`
    } else {
      const headers = [
        { key: "nome_empresa", label: "Empresa" },
        { key: "razao_social", label: "Razão Social" },
        { key: "cnpj", label: "CNPJ" },
        { key: "cnpj_raiz", label: "CNPJ Raiz" },
        { key: "telefone", label: "Telefone" },
        { key: "telefone_tipo", label: "Tipo Telefone" },
        { key: "email", label: "E-mail" },
        { key: "email_valido", label: "E-mail Válido" },
        { key: "email_dominio", label: "Domínio E-mail" },
        { key: "nicho", label: "Nicho/CNAE" },
        { key: "cnae_principal", label: "CNAE Código" },
        { key: "cnae_principal_descricao", label: "CNAE Descrição" },
        { key: "regiao", label: "Região" },
        { key: "municipio", label: "Município" },
        { key: "uf", label: "UF" },
        { key: "cep", label: "CEP" },
        { key: "logradouro", label: "Logradouro" },
        { key: "numero_endereco", label: "Número" },
        { key: "complemento", label: "Complemento" },
        { key: "bairro", label: "Bairro" },
        { key: "situacao_cadastral", label: "Situação Cadastral" },
        { key: "situacao_motivo", label: "Motivo Situação" },
        { key: "porte_empresa", label: "Porte" },
        { key: "natureza_juridica", label: "Natureza Jurídica" },
        { key: "matriz_filial", label: "Matriz/Filial" },
        { key: "eh_mei", label: "MEI" },
        { key: "optante_simples", label: "Simples Nacional" },
        { key: "data_abertura", label: "Data Abertura" },
        { key: "capital_social", label: "Capital Social" },
        { key: "status", label: "Status" },
        { key: "origem", label: "Origem" },
      ]
      csv = toCSV(rows, headers)
      filename = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[exportar] erro:", error)
    return NextResponse.json({ error: "Erro ao exportar" }, { status: 500 })
  }
}
