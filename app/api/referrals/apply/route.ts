import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const BONUS_INDICADO = 300 // créditos para quem se cadastrou com o código

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
    const { data: referrer, error: referrerError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("codigo_referencia", codigo_referencia)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Código de indicação inválido" }, { status: 404 })
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ error: "Você não pode se auto-indicar" }, { status: 400 })
    }

    // Verificar se já tem indicação aplicada
    const { data: existingReferral } = await supabase
      .from("referrals").select("id").eq("referred_id", user.id).single()

    if (existingReferral) {
      return NextResponse.json({ error: "Você já foi indicado por outra pessoa" }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from("usuarios").select("email, creditos, creditos_bonus").eq("id", user.id).single()

    // Criar registro de indicação (status pending — referrer só ganha ao assinar)
    const { error: referralError } = await supabase
      .from("referrals")
      .upsert({
        referrer_id: referrer.id,
        referred_id: user.id,
        referred_email: userData?.email || user.email,
        codigo_referencia,
        status: "pending",
        creditos_bonus: 0, // referrer ainda não ganhou — só ao assinar
      }, { onConflict: "referred_email" })

    if (referralError) {
      console.error("[referral] error:", referralError)
      return NextResponse.json({ error: "Erro ao aplicar indicação" }, { status: 500 })
    }

    // Dar 300 créditos bônus ao indicado imediatamente
    const novoBonus = (userData?.creditos_bonus ?? 0) + BONUS_INDICADO
    await supabase
      .from("usuarios")
      .update({ creditos_bonus: novoBonus })
      .eq("id", user.id)

    // Registrar no histórico
    await supabase.from("historico_creditos").insert({
      user_id: user.id,
      tipo: "bonus_indicado",
      quantidade: BONUS_INDICADO,
      saldo_anterior: userData?.creditos ?? 0,
      saldo_novo: (userData?.creditos ?? 0),
      descricao: `Bônus por usar código de indicação`,
    })

    return NextResponse.json({
      success: true,
      creditos_bonus: BONUS_INDICADO,
      message: `Código aplicado! Você ganhou ${BONUS_INDICADO} créditos bônus para testar a plataforma.`,
    })
  } catch (error) {
    console.error("[referral] apply error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
