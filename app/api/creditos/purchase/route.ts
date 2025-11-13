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

    const body = await request.json()
    const { packageId, billingType = "PIX" } = body

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .eq("ativo", true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Pacote não encontrado" }, { status: 404 })
    }

    // Get user Asaas customer ID
    const { data: usuario } = await supabase.from("usuarios").select("asaas_customer_id, email, nome").eq("id", user.id).single()

    if (!usuario?.asaas_customer_id) {
      return NextResponse.json({ error: "Cliente não cadastrado no Asaas" }, { status: 400 })
    }

    // Calculate total credits with bonus
    const totalCredits = pkg.creditos + Math.floor((pkg.creditos * pkg.bonus_percentage) / 100)

    // Create payment in Asaas
    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: usuario.asaas_customer_id,
        billingType,
        value: pkg.preco,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days
        description: `Pacote de ${totalCredits} créditos - Lidzy`,
        externalReference: `credit_package_${packageId}`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Asaas error:", errorData)
      return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
    }

    const paymentData = await response.json()

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        package_id: packageId,
        creditos: totalCredits,
        valor_pago: pkg.preco,
        asaas_payment_id: paymentData.id,
        status: "pending",
      })
      .select()
      .single()

    if (purchaseError) {
      console.error("[v0] Purchase error:", purchaseError)
      return NextResponse.json({ error: "Erro ao criar registro de compra" }, { status: 500 })
    }

    // Prepare response based on payment type
    const responseData: any = {
      purchase,
      payment: {
        id: paymentData.id,
        billingType,
        value: paymentData.value,
        dueDate: paymentData.dueDate,
      },
    }

    if (billingType === "PIX") {
      responseData.payment.pixQrCode = paymentData.encodedImage
      responseData.payment.pixCopyPaste = paymentData.payload
    } else if (billingType === "BOLETO") {
      responseData.payment.boletoUrl = paymentData.bankSlipUrl
    }

    responseData.payment.invoiceUrl = paymentData.invoiceUrl

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
