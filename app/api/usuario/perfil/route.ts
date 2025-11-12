import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Busca dados do usuário
  const { data: usuario, error: userError } = await supabase.from("usuarios").select("*").eq("id", user.id).single()

  if (userError) {
    console.error("[v0] Erro ao buscar usuário:", userError)
    return NextResponse.json({ error: "Erro ao buscar dados do usuário" }, { status: 500 })
  }

  console.log("[v0] Usuario role in API:", usuario?.role)

  // Busca assinatura ativa (pode não existir)
  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select(`
      *,
      planos (*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  return NextResponse.json({
    usuario,
    assinatura,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { nome, telefone, data_nascimento, cpf_cnpj, endereco, cidade, estado, cep } = body

  const sanitizedData = {
    nome: nome || null,
    telefone: telefone || null,
    data_nascimento: data_nascimento || null,
    cpf_cnpj: cpf_cnpj || null,
    endereco: endereco || null,
    cidade: cidade || null,
    estado: estado || null,
    cep: cep || null,
    atualizado_em: new Date().toISOString(),
  }

  // Atualiza dados do usuário
  const { data, error } = await supabase.from("usuarios").update(sanitizedData).eq("id", user.id).select().single()

  if (error) {
    console.error("[v0] Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro ao atualizar dados" }, { status: 500 })
  }

  return NextResponse.json({ usuario: data })
}
