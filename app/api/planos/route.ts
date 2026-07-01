import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data: planos, error } = await supabase
      .from("planos")
      .select("id, nome, descricao, creditos_mensais, preco_mensal, preco_anual, features")
      .eq("ativo", true)
      .order("preco_mensal", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ planos })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar planos" }, { status: 500 })
  }
}
