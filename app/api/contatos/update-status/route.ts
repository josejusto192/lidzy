import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] User not authenticated")
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { contatoId, status } = await request.json()

    console.log("[v0] Update status API called. User:", user.id, "Contact ID:", contatoId, "New status:", status)

    if (!contatoId || !status) {
      console.error("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing contatoId or status" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("contatos")
      .update({ status })
      .eq("id", contatoId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error updating contact status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.error("[v0] Contact not found or user doesn't have permission")
      return NextResponse.json({ error: "Contato não encontrado ou sem permissão" }, { status: 404 })
    }

    console.log("[v0] Contact status updated successfully in database:", data)
    return NextResponse.json({ success: true, contato: data })
  } catch (error) {
    console.error("[v0] Error in update-status API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
