import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar saldo de créditos do usuário
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("creditos, creditos_leads_usados, creditos_mensagens_usados")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("[v0] Erro ao buscar créditos:", userError)
      return NextResponse.json({ error: "Erro ao buscar créditos" }, { status: 500 })
    }

    // Buscar histórico recente (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: historico, error: histError } = await supabase
      .from("historico_creditos")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50)

    if (histError) {
      console.error("[v0] Erro ao buscar histórico:", histError)
    }

    return NextResponse.json({
      creditos: usuario?.creditos || 0,
      creditos_leads_usados: usuario?.creditos_leads_usados || 0,
      creditos_mensagens_usados: usuario?.creditos_mensagens_usados || 0,
      historico: historico || [],
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar créditos:", error)
    return NextResponse.json({ error: "Erro ao buscar créditos" }, { status: 500 })
  }
}
