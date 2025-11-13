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
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: "ID da assinatura é obrigatório" }, { status: 400 })
    }

    // Buscar assinatura no banco
    const { data: assinatura, error: assinaturaError } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (assinaturaError || !assinatura) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    if (assinatura.status === "canceled" || assinatura.status === "expired") {
      return NextResponse.json({ error: "Assinatura já está cancelada ou expirada" }, { status: 400 })
    }

    // Cancelar assinatura no Asaas
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${assinatura.asaas_subscription_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Erro ao cancelar assinatura Asaas:", errorData)
      return NextResponse.json({ error: "Erro ao cancelar assinatura no Asaas" }, { status: 500 })
    }

    // Atualizar status da assinatura no banco
    const { error: updateError } = await supabase
      .from("assinaturas")
      .update({
        status: "canceled",
        data_fim: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)

    if (updateError) {
      console.error("[v0] Erro ao atualizar status no banco:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar status da assinatura" }, { status: 500 })
    }

    console.log("[v0] Assinatura cancelada com sucesso:", subscriptionId)

    return NextResponse.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
    })
  } catch (error) {
    console.error("[v0] Erro ao cancelar assinatura:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
