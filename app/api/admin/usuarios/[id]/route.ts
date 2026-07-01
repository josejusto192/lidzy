import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth-utils"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Campos permitidos de atualizar
    const allowed = ["creditos", "creditos_bonus", "role", "status", "nome", "email"]
    const update: Record<string, any> = {}
    for (const k of allowed) {
      if (k in body) update[k] = body[k]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 })
    }

    // Se estiver liberando créditos, registra no histórico
    if ("creditos" in body) {
      const { data: atual } = await supabase.from("usuarios").select("creditos").eq("id", id).single()
      const diff = body.creditos - (atual?.creditos ?? 0)
      if (diff !== 0) {
        await supabase.from("historico_creditos").insert({
          user_id: id,
          tipo: "recarga_manual",
          quantidade: diff,
          saldo_anterior: atual?.creditos ?? 0,
          saldo_novo: body.creditos,
          descricao: body.descricao || "Recarga manual pelo admin",
        })
      }
    }

    const { error } = await supabase.from("usuarios").update(update).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = params

    // Banir = setar status banned (não deleta dados)
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get("hard") === "true"

    if (hard) {
      const { error } = await supabase.from("usuarios").delete().eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from("usuarios").update({ status: "banned" }).eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
