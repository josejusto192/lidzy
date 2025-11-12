import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] Webhook Asaas recebido:", body)

    const { event, payment, subscription } = body

    const supabase = await createClient()

    // Processar eventos de pagamento
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // Buscar assinatura pelo subscription_id
      const { data: assinatura, error: assinaturaError } = await supabase
        .from("assinaturas")
        .select("*, planos(*)")
        .eq("asaas_subscription_id", payment.subscription)
        .single()

      if (assinaturaError || !assinatura) {
        console.error("[v0] Assinatura não encontrada:", payment.subscription)
        return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
      }

      // Atualizar status da assinatura
      await supabase
        .from("assinaturas")
        .update({
          status: "active",
          data_inicio: new Date().toISOString(),
        })
        .eq("id", assinatura.id)

      // Adicionar créditos ao usuário
      const { data: usuario } = await supabase.from("usuarios").select("creditos").eq("id", assinatura.user_id).single()

      const creditosAtuais = usuario?.creditos || 0
      const novosCreditos = creditosAtuais + assinatura.planos.creditos_mensais

      await supabase.from("usuarios").update({ creditos: novosCreditos }).eq("id", assinatura.user_id)

      // Registrar no histórico
      await supabase.from("historico_creditos").insert({
        user_id: assinatura.user_id,
        tipo: "recarga",
        quantidade: assinatura.planos.creditos_mensais,
        saldo_anterior: creditosAtuais,
        saldo_novo: novosCreditos,
        descricao: `Créditos da assinatura ${assinatura.planos.nome}`,
        metadata: { payment_id: payment.id, subscription_id: payment.subscription },
      })

      console.log("[v0] Créditos adicionados:", assinatura.planos.creditos_mensais)
    }

    // Processar eventos de assinatura
    if (event === "SUBSCRIPTION_CREATED") {
      await supabase.from("assinaturas").update({ status: "active" }).eq("asaas_subscription_id", subscription.id)
    }

    if (event === "SUBSCRIPTION_UPDATED") {
      await supabase
        .from("assinaturas")
        .update({
          proxima_cobranca: subscription.nextDueDate,
          updated_at: new Date().toISOString(),
        })
        .eq("asaas_subscription_id", subscription.id)
    }

    if (event === "SUBSCRIPTION_DELETED" || event === "SUBSCRIPTION_EXPIRED") {
      await supabase
        .from("assinaturas")
        .update({
          status: event === "SUBSCRIPTION_DELETED" ? "canceled" : "expired",
          data_fim: new Date().toISOString(),
        })
        .eq("asaas_subscription_id", subscription.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao processar webhook Asaas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
