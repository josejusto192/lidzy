import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: conversas, error } = await supabase
      .from("conversas")
      .select(`
        id,
        phone,
        photo,
        contato_id,
        last_message,
        last_message_at,
        unread_count,
        contatos(id, nome_empresa, nicho, status),
        agentes_prospeccao(nome),
        instancias(nome)
      `)
      .order("last_message_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error fetching conversas:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(conversas)
  } catch (error) {
    console.error("[v0] Error in GET /api/conversas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
