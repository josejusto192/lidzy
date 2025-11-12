import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { phone, contato_id } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("[v0] Finding or creating conversation for phone:", phone, "normalized:", normalizedPhone)

    // Get user's active instance
    const { data: instancias } = await supabase
      .from("instancias")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .limit(1)

    const instancia_id = instancias?.[0]?.id || null

    if (!instancia_id) {
      return NextResponse.json({ error: "Nenhuma instância ativa encontrada" }, { status: 400 })
    }

    const { data: conversa, error: upsertError } = await supabase
      .from("conversas")
      .upsert(
        {
          user_id: user.id,
          phone: normalizedPhone,
          contato_id: contato_id || null,
          instancia_id,
          last_message: "Conversa iniciada",
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "phone,instancia_id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (upsertError) {
      console.error("[v0] Error upserting conversation:", upsertError)
      return NextResponse.json({ error: "Erro ao criar/atualizar conversa" }, { status: 500 })
    }

    console.log("[v0] Conversation upserted:", conversa.id)
    return NextResponse.json({ conversa })
  } catch (error) {
    console.error("[v0] Error in find-or-create:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
