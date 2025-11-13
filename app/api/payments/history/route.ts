import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar dados do usuário para pegar o customer ID
    const { data: usuario } = await supabase.from("usuarios").select("asaas_customer_id").eq("id", user.id).single()

    if (!usuario?.asaas_customer_id) {
      return NextResponse.json({ payments: [], subscriptions: [] })
    }

    // Buscar pagamentos do Asaas
    const paymentsResponse = await fetch(`${ASAAS_API_URL}/payments?customer=${usuario.asaas_customer_id}`, {
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
    })

    if (!paymentsResponse.ok) {
      console.error("[v0] Erro ao buscar pagamentos Asaas")
      return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 })
    }

    const paymentsData = await paymentsResponse.json()

    // Buscar assinaturas do banco
    const { data: assinaturas } = await supabase
      .from("assinaturas")
      .select("*, planos(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Buscar histórico de créditos
    const { data: historico } = await supabase
      .from("historico_creditos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      payments: paymentsData.data || [],
      subscriptions: assinaturas || [],
      creditHistory: historico || [],
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar histórico:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
