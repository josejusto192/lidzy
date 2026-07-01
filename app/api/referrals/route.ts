import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Get user's referrals
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Get user's referral code
    let { data: usuario } = await supabase.from("usuarios").select("codigo_referencia").eq("id", user.id).single()

    // Gera código se não existir (fallback para usuários antigos)
    if (!usuario?.codigo_referencia) {
      const codigo = Math.random().toString(36).substring(2, 10).toUpperCase()
      await supabase.from("usuarios").update({ codigo_referencia: codigo }).eq("id", user.id)
      usuario = { codigo_referencia: codigo }
    }

    // Indicações feitas pelo usuário (ele é o referrer)
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("*, usuarios!referrals_referred_id_fkey(nome, email)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    if (referralsError) {
      console.error("[v0] Referrals error:", referralsError)
    }

    // Indicação recebida pelo usuário (ele é o indicado) — para banner de CPF pendente
    const { data: myReferral } = await supabase
      .from("referrals")
      .select("id, referrer_id, bonus_liberado, status")
      .eq("referred_id", user.id)
      .maybeSingle()

    // Calculate stats
    const stats = {
      total: referrals?.length || 0,
      completed: referrals?.filter((r) => r.status === "completed" || r.status === "rewarded").length || 0,
      pending: referrals?.filter((r) => r.status === "pending").length || 0,
      totalCreditsEarned: referrals?.reduce((sum, r) => sum + (r.creditos_bonus || 0), 0) || 0,
    }

    return NextResponse.json({
      codigo_referencia: usuario?.codigo_referencia,
      stats,
      referrals: referrals || [],
      my_referral: myReferral || null,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Create referral invitation
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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Get user's referral code
    const { data: usuario } = await supabase.from("usuarios").select("codigo_referencia, nome").eq("id", user.id).single()

    if (!usuario?.codigo_referencia) {
      return NextResponse.json({ error: "Código de referência não encontrado" }, { status: 404 })
    }

    // Check if email already referred
    const { data: existing } = await supabase.from("referrals").select("id").eq("referred_email", email).single()

    if (existing) {
      return NextResponse.json({ error: "Este email já foi indicado" }, { status: 400 })
    }

    // Create referral
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: user.id,
        referred_email: email,
        codigo_referencia: usuario.codigo_referencia,
        status: "pending",
      })
      .select()
      .single()

    if (referralError) {
      console.error("[v0] Referral error:", referralError)
      return NextResponse.json({ error: "Erro ao criar indicação" }, { status: 500 })
    }

    // TODO: Send invitation email to referred user

    return NextResponse.json({
      referral,
      message: "Convite enviado com sucesso!",
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
