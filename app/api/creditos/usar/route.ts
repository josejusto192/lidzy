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

    const { tipo, quantidade, descricao, metadata } = await request.json()

    if (!tipo || !quantidade) {
      return NextResponse.json({ error: "Tipo e quantidade são obrigatórios" }, { status: 400 })
    }

    if (!["uso_lead", "uso_mensagem"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    // Buscar saldo atual
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("creditos, creditos_leads_usados, creditos_mensagens_usados")
      .eq("id", user.id)
      .single()

    if (userError || !usuario) {
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
    }

    const saldoAtual = usuario.creditos || 0

    // Verificar se tem créditos suficientes
    if (saldoAtual < quantidade) {
      return NextResponse.json({ error: "Créditos insuficientes", saldo: saldoAtual }, { status: 400 })
    }

    const novoSaldo = saldoAtual - quantidade

    // Atualizar saldo e contador específico
    const updateData: any = {
      creditos: novoSaldo,
    }

    if (tipo === "uso_lead") {
      updateData.creditos_leads_usados = (usuario.creditos_leads_usados || 0) + quantidade
    } else if (tipo === "uso_mensagem") {
      updateData.creditos_mensagens_usados = (usuario.creditos_mensagens_usados || 0) + quantidade
    }

    const { error: updateError } = await supabase.from("usuarios").update(updateData).eq("id", user.id)

    if (updateError) {
      console.error("[v0] Erro ao atualizar créditos:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar créditos" }, { status: 500 })
    }

    // Registrar no histórico
    const { error: histError } = await supabase.from("historico_creditos").insert({
      user_id: user.id,
      tipo,
      quantidade: -quantidade,
      saldo_anterior: saldoAtual,
      saldo_novo: novoSaldo,
      descricao:
        descricao ||
        `Uso de ${quantidade} crédito(s) para ${tipo === "uso_lead" ? "geração de leads" : "envio de mensagens"}`,
      metadata: metadata || {},
    })

    if (histError) {
      console.error("[v0] Erro ao registrar histórico:", histError)
    }

    return NextResponse.json({
      success: true,
      saldo_anterior: saldoAtual,
      saldo_novo: novoSaldo,
      quantidade_usada: quantidade,
    })
  } catch (error) {
    console.error("[v0] Erro ao usar créditos:", error)
    return NextResponse.json({ error: "Erro ao usar créditos" }, { status: 500 })
  }
}
