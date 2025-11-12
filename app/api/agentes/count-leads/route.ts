import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { nichos, status, regiao } = body

    console.log("[v0] Contando leads com filtros:", { nichos, status, regiao })

    // Start with base query
    let query = supabase.from("contatos").select("*", { count: "exact", head: true }).eq("user_id", user.id)

    // Apply filters
    if (nichos && nichos.length > 0) {
      query = query.in("nicho", nichos)
    }

    if (status && status.length > 0) {
      query = query.in("status", status)
    }

    if (regiao && regiao.length > 0) {
      query = query.in("regiao", regiao)
    }

    const { count, error } = await query

    if (error) {
      console.error("[v0] Erro ao contar leads:", error)
      return NextResponse.json({ error: "Erro ao contar leads", details: error.message }, { status: 500 })
    }

    console.log("[v0] Total de leads encontrados:", count)
    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Erro inesperado ao contar leads:", error)
    return NextResponse.json(
      {
        error: "Erro ao contar leads",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
