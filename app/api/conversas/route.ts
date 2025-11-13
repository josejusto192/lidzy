import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Autenticar usuário (necessário para RLS funcionar)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[Conversas API] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Conversas API] User authenticated:", user.id)

    const { data: conversas, error } = await supabase
      .from("conversas")
      .select(`
        id,
        phone,
        photo,
        chat_name,
        contato_id,
        last_message,
        last_message_at,
        unread_count,
        contatos(id, nome_empresa, nicho, status),
        agentes_prospeccao(nome),
        instancias(nome)
      `)
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[Conversas API] Error fetching conversas:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[Conversas API] Found", conversas?.length || 0, "conversas")

    return NextResponse.json(conversas || [])
  } catch (error) {
    console.error("[Conversas API] Error in GET /api/conversas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
