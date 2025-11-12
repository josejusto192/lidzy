import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ativo } = body

    if (!id || ativo === undefined) {
      return NextResponse.json({ error: "ID e status ativo são obrigatórios" }, { status: 400 })
    }

    const { data: instancia, error } = await supabase
      .from("instancias")
      .update({ ativo })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar status da instância:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instancia })
  } catch (error) {
    console.error("Erro ao atualizar status da instância:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
