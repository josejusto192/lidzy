import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const type = searchParams.get("type") // 'invoice' ou 'boleto'

    if (!paymentId || !type) {
      return NextResponse.json({ error: "PaymentId e type são obrigatórios" }, { status: 400 })
    }

    // Buscar dados do usuário para pegar o customer ID
    const { data: usuario } = await supabase.from("usuarios").select("asaas_customer_id").eq("id", user.id).single()

    if (!usuario?.asaas_customer_id) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // Buscar detalhes do pagamento para verificar se pertence ao usuário
    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
    })

    if (!paymentResponse.ok) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    const paymentData = await paymentResponse.json()

    // Verificar se o pagamento pertence ao usuário
    if (paymentData.customer !== usuario.asaas_customer_id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    let downloadUrl = ""

    if (type === "invoice") {
      downloadUrl = paymentData.invoiceUrl
    } else if (type === "boleto") {
      downloadUrl = paymentData.bankSlipUrl
    } else if (type === "invoice-pdf") {
      // Buscar o PDF da invoice
      const pdfResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/identificationField`, {
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
      })

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json()
        downloadUrl = pdfData.identificationField
      }
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: "Documento não disponível" }, { status: 404 })
    }

    return NextResponse.json({ downloadUrl })
  } catch (error) {
    console.error("[v0] Erro ao buscar documento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
