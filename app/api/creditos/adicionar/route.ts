import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { quantidade, tipo, descricao, metadata } = await request.json()

    if (!quantidade || quantidade <= 0) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })
    }

    // Buscar saldo atual
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("creditos")
      .eq("id", user.id)
      .single()

    if (userError || !usuario) {
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
    }

    const saldoAtual = usuario.creditos || 0
    const novoSaldo = saldoAtual + quantidade

    // Atualizar saldo
    const { error: updateError } = await supabase.from("usuarios").update({ creditos: novoSaldo }).eq("id", user.id)

    if (updateError) {
      console.error("[v0] Erro ao adicionar créditos:", updateError)
      return NextResponse.json({ error: "Erro ao adicionar créditos" }, { status: 500 })
    }

    // Registrar no histórico
    const { error: histError } = await supabase.from("historico_creditos").insert({
      user_id: user.id,
      tipo: tipo || "compra",
      quantidade,
      saldo_anterior: saldoAtual,
      saldo_novo: novoSaldo,
      descricao: descricao || `Adição de ${quantidade} crédito(s)`,
      metadata: metadata || {},
    })

    if (histError) {
      console.error("[v0] Erro ao registrar histórico:", histError)
    }

    return NextResponse.json({
      success: true,
      saldo_anterior: saldoAtual,
      saldo_novo: novoSaldo,
      quantidade_adicionada: quantidade,
    })
  } catch (error) {
    console.error("[v0] Erro ao adicionar créditos:", error)
    return NextResponse.json({ error: "Erro ao adicionar créditos" }, { status: 500 })
  }
}
