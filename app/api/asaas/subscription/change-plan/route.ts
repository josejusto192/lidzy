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
    const { novoPlanoId } = body

    if (!novoPlanoId) {
      return NextResponse.json({ error: "Novo plano é obrigatório" }, { status: 400 })
    }

    // Get current subscription
    const { data: assinaturaAtual, error: assinaturaError } = await supabase
      .from("assinaturas")
      .select("*, planos!plano_id(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (assinaturaError || !assinaturaAtual) {
      return NextResponse.json({ error: "Assinatura ativa não encontrada" }, { status: 404 })
    }

    // Get new plan
    const { data: novoPlano, error: novoPlanoError } = await supabase
      .from("planos")
      .select("*")
      .eq("id", novoPlanoId)
      .single()

    if (novoPlanoError || !novoPlano) {
      return NextResponse.json({ error: "Novo plano não encontrado" }, { status: 404 })
    }

    // Check if it's the same plan
    if (assinaturaAtual.plano_id === novoPlanoId) {
      return NextResponse.json({ error: "Você já está neste plano" }, { status: 400 })
    }

    // Determine if upgrade or downgrade
    const planoAtualPreco =
      assinaturaAtual.periodo === "yearly" ? assinaturaAtual.planos.preco_anual : assinaturaAtual.planos.preco_mensal
    const novoPlanoPreco = assinaturaAtual.periodo === "yearly" ? novoPlano.preco_anual : novoPlano.preco_mensal

    const isUpgrade = novoPlanoPreco > planoAtualPreco

    // Update subscription in Asaas
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${assinaturaAtual.asaas_subscription_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        value: novoPlanoPreco,
        description: `Assinatura ${novoPlano.nome} - Lidzy`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Asaas error:", errorData)
      return NextResponse.json({ error: "Erro ao atualizar assinatura no Asaas" }, { status: 500 })
    }

    const subscriptionData = await response.json()

    // Update subscription in database
    const { error: updateError } = await supabase
      .from("assinaturas")
      .update({
        plano_id: novoPlanoId,
        proxima_cobranca: subscriptionData.nextDueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinaturaAtual.id)

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar assinatura no banco" }, { status: 500 })
    }

    // If upgrade, add immediate credits difference
    if (isUpgrade) {
      const creditosDiff = novoPlano.creditos_mensais - assinaturaAtual.planos.creditos_mensais

      if (creditosDiff > 0) {
        const { data: usuario } = await supabase.from("usuarios").select("creditos").eq("id", user.id).single()

        const novosCreditos = (usuario?.creditos || 0) + creditosDiff

        await supabase.from("usuarios").update({ creditos: novosCreditos }).eq("id", user.id)

        // Register in history
        await supabase.from("historico_creditos").insert({
          user_id: user.id,
          tipo: "upgrade",
          quantidade: creditosDiff,
          saldo_anterior: usuario?.creditos || 0,
          saldo_novo: novosCreditos,
          descricao: `Upgrade para plano ${novoPlano.nome}`,
          metadata: { plano_anterior: assinaturaAtual.plano_id, plano_novo: novoPlanoId },
        })
      }
    }

    return NextResponse.json({
      success: true,
      tipo: isUpgrade ? "upgrade" : "downgrade",
      message: isUpgrade ? "Plano atualizado com sucesso!" : "Plano alterado. As mudanças entrarão em vigor na próxima cobrança.",
      assinatura: {
        plano: novoPlano.nome,
        proxima_cobranca: subscriptionData.nextDueDate,
      },
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
