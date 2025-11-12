import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Fetch all contatos for this user
    const { data: contatos, error } = await supabase
      .from("contatos")
      .select("nicho, status, regiao")
      .eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error fetching contatos:", error)
      return NextResponse.json({ error: "Erro ao buscar filtros" }, { status: 500 })
    }

    // Extract unique values for each filter
    const nichos = Array.from(new Set(contatos.map((c) => c.nicho).filter(Boolean))).sort()
    const status = Array.from(new Set(contatos.map((c) => c.status).filter(Boolean))).sort()
    const regioes = Array.from(new Set(contatos.map((c) => c.regiao).filter(Boolean))).sort()

    console.log("[v0] Filters loaded:", { nichos: nichos.length, status: status.length, regioes: regioes.length })

    return NextResponse.json({
      nichos,
      status,
      regioes,
    })
  } catch (error) {
    console.error("[v0] Error in filters route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
