import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { codigo_referencia } = body

    if (!codigo_referencia) {
      return NextResponse.json({ error: "Código de referência não fornecido" }, { status: 400 })
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("codigo_referencia", codigo_referencia)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Código de indicação inválido" }, { status: 404 })
    }

    // Check if user already has a referral applied
    const { data: existingReferral } = await supabase.from("referrals").select("id").eq("referred_id", user.id).single()

    if (existingReferral) {
      return NextResponse.json({ error: "Você já foi indicado por outra pessoa" }, { status: 400 })
    }

    // Check if trying to refer themselves
    if (referrer.id === user.id) {
      return NextResponse.json({ error: "Você não pode se auto-indicar" }, { status: 400 })
    }

    // Get user email
    const { data: userData } = await supabase.from("usuarios").select("email").eq("id", user.id).single()

    // Create or update referral
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .upsert(
        {
          referrer_id: referrer.id,
          referred_id: user.id,
          referred_email: userData?.email || user.email,
          codigo_referencia,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "referred_email",
        }
      )
      .select()
      .single()

    if (referralError) {
      console.error("[v0] Referral error:", referralError)
      return NextResponse.json({ error: "Erro ao aplicar indicação" }, { status: 500 })
    }

    console.log("[v0] Referral applied successfully for user:", user.id)

    return NextResponse.json({
      success: true,
      message: "Indicação aplicada com sucesso! Os bônus serão creditados quando você ativar sua conta.",
    })
  } catch (error) {
    console.error("[v0] Apply referral error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
