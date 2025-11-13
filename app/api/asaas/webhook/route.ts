import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  sendEmail,
  getPaymentConfirmedEmailHtml,
  getPaymentOverdueEmailHtml,
  getSubscriptionCanceledEmailHtml,
  getPaymentRefundedEmailHtml,
} from "@/lib/email"

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticação do webhook
    const webhookToken = request.headers.get("asaas-access-token")

    if (!ASAAS_WEBHOOK_TOKEN) {
      console.error("[v0] ASAAS_WEBHOOK_TOKEN não configurado!")
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
    }

    if (webhookToken !== ASAAS_WEBHOOK_TOKEN) {
      console.error("[v0] Token inválido no webhook")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Webhook Asaas recebido:", body)

    const { event, payment, subscription } = body

    const supabase = await createClient()

    // Processar eventos de pagamento
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // 2. Verificar idempotência - evitar processar o mesmo pagamento 2x
      const paymentId = payment?.id
      if (paymentId) {
        const { data: jaProcessado } = await supabase
          .from("historico_creditos")
          .select("id")
          .eq("metadata->>payment_id", paymentId)
          .single()

        if (jaProcessado) {
          console.log("[v0] Pagamento já processado:", paymentId)
          return NextResponse.json({ success: true, message: "Pagamento já processado" })
        }
      }

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
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("creditos, nome, email")
        .eq("id", assinatura.user_id)
        .single()

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

      // Enviar email de confirmação
      if (usuario?.email) {
        await sendEmail({
          to: usuario.email,
          subject: "Pagamento Confirmado - Créditos Adicionados! 🎉",
          html: getPaymentConfirmedEmailHtml(
            usuario.nome || "Cliente",
            assinatura.planos.nome,
            assinatura.planos.creditos_mensais,
            new Date(payment.paymentDate || payment.confirmedDate).toLocaleDateString("pt-BR")
          ),
        })
      }
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
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("*, planos(*), usuarios(email, nome)")
        .eq("asaas_subscription_id", subscription.id)
        .single()

      if (assinatura) {
        await supabase
          .from("assinaturas")
          .update({
            status: event === "SUBSCRIPTION_DELETED" ? "canceled" : "expired",
            data_fim: new Date().toISOString(),
          })
          .eq("asaas_subscription_id", subscription.id)

        // Enviar email de cancelamento
        if (assinatura.usuarios?.email && event === "SUBSCRIPTION_DELETED") {
          await sendEmail({
            to: assinatura.usuarios.email,
            subject: "Assinatura Cancelada",
            html: getSubscriptionCanceledEmailHtml(assinatura.usuarios.nome || "Cliente", assinatura.planos.nome),
          })
        }
      }
    }

    // Processar eventos de pagamento atrasado
    if (event === "PAYMENT_OVERDUE") {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("*, planos(*), usuarios(email, nome)")
        .eq("asaas_subscription_id", payment.subscription)
        .single()

      if (assinatura) {
        await supabase
          .from("assinaturas")
          .update({
            status: "overdue",
            updated_at: new Date().toISOString(),
          })
          .eq("id", assinatura.id)

        console.log("[v0] Assinatura marcada como atrasada:", assinatura.id)

        // Enviar email de alerta
        if (assinatura.usuarios?.email) {
          await sendEmail({
            to: assinatura.usuarios.email,
            subject: "Pagamento em Atraso - Ação Necessária ⚠️",
            html: getPaymentOverdueEmailHtml(
              assinatura.usuarios.nome || "Cliente",
              assinatura.planos.nome,
              new Date(payment.dueDate).toLocaleDateString("pt-BR")
            ),
          })
        }
      }
    }

    // Processar pagamento deletado/cancelado
    if (event === "PAYMENT_DELETED") {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("asaas_subscription_id", payment.subscription)
        .single()

      if (assinatura) {
        await supabase
          .from("assinaturas")
          .update({
            status: "canceled",
            data_fim: new Date().toISOString(),
          })
          .eq("id", assinatura.id)

        console.log("[v0] Assinatura cancelada por pagamento deletado:", assinatura.id)
      }
    }

    // Processar reembolso
    if (event === "PAYMENT_REFUNDED") {
      const paymentId = payment?.id

      // Buscar a transação de crédito original
      const { data: transacao } = await supabase
        .from("historico_creditos")
        .select("*, usuarios(*)")
        .eq("metadata->>payment_id", paymentId)
        .eq("tipo", "recarga")
        .single()

      if (transacao) {
        // Remover os créditos que foram adicionados
        const creditosAtuais = transacao.usuarios.creditos || 0
        const novosCreditos = Math.max(0, creditosAtuais - transacao.quantidade)

        await supabase.from("usuarios").update({ creditos: novosCreditos }).eq("id", transacao.user_id)

        // Registrar estorno no histórico
        await supabase.from("historico_creditos").insert({
          user_id: transacao.user_id,
          tipo: "estorno",
          quantidade: transacao.quantidade,
          saldo_anterior: creditosAtuais,
          saldo_novo: novosCreditos,
          descricao: `Estorno de pagamento reembolsado`,
          metadata: { payment_id: paymentId, original_transaction_id: transacao.id },
        })

        console.log("[v0] Créditos estornados por reembolso:", transacao.quantidade)

        // Enviar email de reembolso
        if (transacao.usuarios?.email) {
          await sendEmail({
            to: transacao.usuarios.email,
            subject: "Reembolso Processado",
            html: getPaymentRefundedEmailHtml(
              transacao.usuarios.nome || "Cliente",
              payment.value || 0,
              transacao.quantidade
            ),
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao processar webhook Asaas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
