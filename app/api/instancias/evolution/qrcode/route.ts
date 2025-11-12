import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get("instanceName")

    if (!instanceName) {
      return NextResponse.json({ error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "http://31.97.24.93:7458"
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "jose1234"

    console.log("[v0] Buscando QR code para instância:", instanceName)

    const response = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: evolutionApiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Erro ao buscar QR code:", errorText)
      return NextResponse.json({ error: "Erro ao buscar QR code", details: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] QR code obtido com sucesso")

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro ao buscar QR code:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
