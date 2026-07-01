import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CDD_URL = "https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const apiKey = process.env.CASA_DOS_DADOS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "CASA_DOS_DADOS_NOT_CONFIGURED" }, { status: 503 })

    const body = await request.json()

    const cddRes = await fetch(CDD_URL, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!cddRes.ok) {
      const text = await cddRes.text()
      const msg =
        cddRes.status === 401 ? "Chave da API inválida." :
        cddRes.status === 403 ? "Saldo esgotado na Casa dos Dados." :
        `Erro ${cddRes.status} na API.`
      return NextResponse.json({ error: msg, details: text.slice(0, 300) }, { status: 502 })
    }

    const data = await cddRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[cdd/buscar]", error)
    return NextResponse.json({ error: "Erro ao consultar API." }, { status: 500 })
  }
}
