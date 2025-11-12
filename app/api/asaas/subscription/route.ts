import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { planoId, periodo, customerId } = body

    // Buscar dados do plano
    const { data: plano, error: planoError } = await supabase.from("planos").select("*").eq("id", planoId).single()

    if (planoError || !plano) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const valor = periodo === "yearly" ? plano.preco_anual : plano.preco_mensal
    const cycle = periodo === "yearly" ? "YEARLY" : "MONTHLY"

    // Criar assinatura no Asaas
    const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO",
        value: valor,
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias
        cycle,
        description: `Assinatura ${plano.nome} - Lidzy`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Erro ao criar assinatura Asaas:", errorData)
      return NextResponse.json({ error: "Erro ao criar assinatura no Asaas" }, { status: 500 })
    }

    const subscriptionData = await response.json()

    // Criar registro de assinatura no banco
    const { data: assinatura, error: assinaturaError } = await supabase
      .from("assinaturas")
      .insert({
        user_id: user.id,
        plano_id: planoId,
        asaas_subscription_id: subscriptionData.id,
        asaas_customer_id: customerId,
        status: "pending",
        periodo,
        proxima_cobranca: subscriptionData.nextDueDate,
      })
      .select()
      .single()

    if (assinaturaError) {
      console.error("[v0] Erro ao criar assinatura no banco:", assinaturaError)
      return NextResponse.json({ error: "Erro ao salvar assinatura" }, { status: 500 })
    }

    // Atualizar usuário com assinatura_id
    await supabase.from("usuarios").update({ assinatura_id: assinatura.id }).eq("id", user.id)

    return NextResponse.json({
      subscription: assinatura,
      paymentUrl: subscriptionData.invoiceUrl,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar assinatura:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
