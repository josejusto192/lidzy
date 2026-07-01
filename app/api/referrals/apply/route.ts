import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { codigo_referencia } = await request.json()
    if (!codigo_referencia) {
      return NextResponse.json({ error: "Código de referência não fornecido" }, { status: 400 })
    }

    // Buscar quem indicou
    const { data: referrer } = await supabase
      .from("usuarios")
      .select("id, nome")
      .eq("codigo_referencia", codigo_referencia)
      .single()

    if (!referrer) {
      return NextResponse.json({ error: "Código de indicação inválido" }, { status: 404 })
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ error: "Você não pode se auto-indicar" }, { status: 400 })
    }

    // Verifica se já tem indicação aplicada
    const { data: existing } = await supabase
      .from("referrals")
      .select("id, bonus_liberado")
      .eq("referred_id", user.id)
      .single()

    if (existing) {
      // Já linkado — informa status
      return NextResponse.json({
        success: true,
        already_applied: true,
        bonus_liberado: existing.bonus_liberado,
        message: existing.bonus_liberado
          ? "Indicação já aplicada e bônus liberado."
          : "Indicação pendente. Complete seu perfil com CPF para liberar os créditos.",
      })
    }

    const { data: userData } = await supabase
      .from("usuarios")
      .select("email, indicado_por")
      .eq("id", user.id)
      .single()

    // Se já tem indicado_por, não sobrescreve
    if (userData?.indicado_por) {
      return NextResponse.json({ success: true, already_applied: true })
    }

    // Salva quem indicou no perfil do usuário
    await supabase
      .from("usuarios")
      .update({ indicado_por: referrer.id })
      .eq("id", user.id)

    // Cria registro de indicação pendente
    const { error: referralError } = await supabase
      .from("referrals")
      .upsert({
        referrer_id: referrer.id,
        referred_id: user.id,
        referred_email: userData?.email || user.email,
        codigo_referencia,
        status: "pending",
        bonus_liberado: false,
        creditos_bonus: 0,
      }, { onConflict: "referred_email" })

    if (referralError) {
      console.error("[referral apply]", referralError)
      return NextResponse.json({ error: "Erro ao registrar indicação" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pending: true,
      referrer_nome: referrer.nome,
      message: "Código aplicado! Complete seu perfil com CPF para liberar 300 créditos de bônus.",
    })
  } catch (error) {
    console.error("[referral apply]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
