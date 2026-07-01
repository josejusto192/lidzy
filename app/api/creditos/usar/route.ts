import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { tipo, quantidade, descricao, metadata } = await request.json()

    if (!tipo || !quantidade) {
      return NextResponse.json({ error: "Tipo e quantidade são obrigatórios" }, { status: 400 })
    }

    if (!["uso_lead", "uso_mensagem"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("usar_creditos", {
      p_user_id:   user.id,
      p_quantidade: quantidade,
      p_tipo:      tipo,
      p_descricao: descricao ?? null,
      p_metadata:  metadata ?? {},
    })

    if (error) {
      if (error.message?.includes("creditos_insuficientes")) {
        return NextResponse.json({ error: "Créditos insuficientes" }, { status: 400 })
      }
      console.error("[creditos/usar] RPC error:", error)
      return NextResponse.json({ error: "Erro ao usar créditos" }, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success:         true,
      saldo_anterior:  row.saldo_anterior,
      saldo_novo:      row.saldo_novo,
      quantidade_usada: quantidade,
    })
  } catch (error) {
    console.error("[creditos/usar] Erro:", error)
    return NextResponse.json({ error: "Erro ao usar créditos" }, { status: 500 })
  }
}
