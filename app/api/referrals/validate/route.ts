import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get("codigo")

    if (!codigo) {
      return NextResponse.json({ valid: false, error: "Código não fornecido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if referral code exists
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("id, nome, email")
      .eq("codigo_referencia", codigo)
      .single()

    if (error || !usuario) {
      return NextResponse.json({ valid: false, error: "Código de indicação inválido" }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        nome: usuario.nome,
      },
    })
  } catch (error) {
    console.error("[v0] Validate referral error:", error)
    return NextResponse.json({ valid: false, error: "Erro ao validar código" }, { status: 500 })
  }
}
