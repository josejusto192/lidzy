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

  // Se vier CPF (11 dígitos), trata via RPC para liberar bônus de indicação
  const cpfClean = cpf_cnpj?.replace(/\D/g, "")
  const isCpf = cpfClean?.length === 11

  // Verifica se usuário já tinha CPF cadastrado
  const { data: usuarioAtual } = await supabase
    .from("usuarios")
    .select("cpf, cpf_cnpj, indicado_por")
    .eq("id", user.id)
    .single()

  let bonusResult: any = null

  // Primeiro CPF sendo cadastrado com indicação pendente → tenta liberar bônus
  if (isCpf && !usuarioAtual?.cpf && usuarioAtual?.indicado_por) {
    const { data: rpcResult, error: rpcError } = await supabase.rpc("liberar_bonus_indicacao", {
      p_user_id: user.id,
      p_cpf: cpfClean,
    })

    if (rpcError?.message?.includes("usuarios_cpf_unique") || rpcResult?.error?.includes("CPF já cadastrado")) {
      return NextResponse.json({ error: "CPF já cadastrado em outra conta" }, { status: 409 })
    }

    bonusResult = rpcResult
  } else if (isCpf && !usuarioAtual?.cpf) {
    // CPF novo sem indicação — só salva o CPF via RPC (resolve unique constraint)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("liberar_bonus_indicacao", {
      p_user_id: user.id,
      p_cpf: cpfClean,
    })
    if (rpcError?.message?.includes("usuarios_cpf_unique") || rpcResult?.error?.includes("CPF já cadastrado")) {
      return NextResponse.json({ error: "CPF já cadastrado em outra conta" }, { status: 409 })
    }
    bonusResult = rpcResult
  }

  const sanitizedData: Record<string, any> = {
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

  const { data, error } = await supabase.from("usuarios").update(sanitizedData).eq("id", user.id).select().single()

  if (error) {
    console.error("[v0] Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro ao atualizar dados" }, { status: 500 })
  }

  return NextResponse.json({ usuario: data, bonus: bonusResult })
}
