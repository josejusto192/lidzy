import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3"

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

    // Buscar dados do usuário
    const { data: usuario, error: userError } = await supabase.from("usuarios").select("*").eq("id", user.id).single()

    if (userError || !usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Se já tem customer_id, retornar
    if (usuario.asaas_customer_id) {
      return NextResponse.json({ customerId: usuario.asaas_customer_id })
    }

    const body = await request.json()
    const { name, cpfCnpj, email, phone, postalCode, address, addressNumber, province } = body

    // Criar cliente no Asaas
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name,
        cpfCnpj,
        email,
        phone,
        postalCode,
        address,
        addressNumber,
        province,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Erro ao criar cliente Asaas:", errorData)
      return NextResponse.json({ error: "Erro ao criar cliente no Asaas" }, { status: 500 })
    }

    const customerData = await response.json()

    // Salvar customer_id no banco
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ asaas_customer_id: customerData.id })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Erro ao salvar customer_id:", updateError)
    }

    return NextResponse.json({ customerId: customerData.id })
  } catch (error) {
    console.error("[v0] Erro ao criar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
