import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Called when user saves their profile with a CPF for the first time
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { cpf } = await request.json()
    const cpfClean = cpf?.replace(/\D/g, "")

    if (!cpfClean || cpfClean.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 })
    }

    const { data: result, error } = await supabase.rpc("liberar_bonus_indicacao", {
      p_user_id: user.id,
      p_cpf: cpfClean,
    })

    if (error) {
      // Unique violation = CPF já usado em outra conta
      if (error.code === "23505" || error.message?.includes("usuarios_cpf_unique")) {
        return NextResponse.json({ error: "CPF já cadastrado em outra conta" }, { status: 409 })
      }
      console.error("[referral completar]", error)
      return NextResponse.json({ error: error.message || "Erro ao processar" }, { status: 500 })
    }

    if (!result?.ok) {
      return NextResponse.json({ error: result?.error || "Erro ao processar CPF" }, { status: 409 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[referral completar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
