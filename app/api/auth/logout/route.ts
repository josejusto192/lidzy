import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 })
  }
}
