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
    const { planoId, periodo, customerId, billingType = "BOLETO", creditCard, creditCardHolderInfo } = body

    // Validar tipo de pagamento
    const validBillingTypes = ["BOLETO", "PIX", "CREDIT_CARD"]
    if (!validBillingTypes.includes(billingType)) {
      return NextResponse.json({ error: "Tipo de pagamento inválido" }, { status: 400 })
    }

    // Se for cartão de crédito, validar dados do cartão
    if (billingType === "CREDIT_CARD" && (!creditCard || !creditCardHolderInfo)) {
      return NextResponse.json({ error: "Dados do cartão de crédito são obrigatórios" }, { status: 400 })
    }

    // Buscar dados do plano
    const { data: plano, error: planoError } = await supabase.from("planos").select("*").eq("id", planoId).single()

    if (planoError || !plano) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const valor = periodo === "yearly" ? plano.preco_anual : plano.preco_mensal
    const cycle = periodo === "yearly" ? "YEARLY" : "MONTHLY"

    // Preparar payload para criar assinatura
    const subscriptionPayload: any = {
      customer: customerId,
      billingType,
      value: valor,
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias
      cycle,
      description: `Assinatura ${plano.nome} - Lidzy`,
    }

    // Se for cartão de crédito, adicionar dados do cartão
    if (billingType === "CREDIT_CARD") {
      subscriptionPayload.creditCard = creditCard
      subscriptionPayload.creditCardHolderInfo = creditCardHolderInfo
    }

    // Criar assinatura no Asaas
    const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify(subscriptionPayload),
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

    // Preparar resposta de acordo com o tipo de pagamento
    const responseData: any = {
      subscription: assinatura,
      billingType,
    }

    if (billingType === "BOLETO") {
      responseData.paymentUrl = subscriptionData.invoiceUrl
      responseData.boletoUrl = subscriptionData.bankSlipUrl
    } else if (billingType === "PIX") {
      responseData.paymentUrl = subscriptionData.invoiceUrl
      responseData.pixQrCode = subscriptionData.pixQrCode
      responseData.pixCopyPaste = subscriptionData.pixCopyPaste
    } else if (billingType === "CREDIT_CARD") {
      responseData.status = subscriptionData.status
      responseData.message = "Assinatura criada com cartão de crédito"
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Erro ao criar assinatura:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
