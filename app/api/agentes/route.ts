import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: agentes, error } = await supabase
      .from("agentes_prospeccao")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agents:", error)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    return NextResponse.json({ agentes })
  } catch (error) {
    console.error("[v0] Error in GET /api/agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nome,
      descricao_persona,
      produto_servico,
      tom_voz,
      objetivo,
      informacoes_adicionais,
      horario_inicio,
      limite_mensagens,
      nichos,
      status,
      regiao,
      instancia_id, // Added instancia_id field
    } = body

    if (!nome || !produto_servico || !tom_voz) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const { data: agente, error } = await supabase
      .from("agentes_prospeccao")
      .insert({
        user_id: user.id,
        nome,
        descricao_persona,
        produto_servico,
        tom_voz,
        objetivo,
        informacoes_adicionais,
        horario_inicio,
        limite_mensagens,
        nichos,
        status,
        regiao,
        instancia_id, // Include instancia_id in insert
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating agent:", error)
      return NextResponse.json({ error: "Erro ao criar agente" }, { status: 500 })
    }

    return NextResponse.json({ agente }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      nome,
      descricao_persona,
      produto_servico,
      tom_voz,
      objetivo,
      informacoes_adicionais,
      ativo,
      horario_inicio,
      limite_mensagens,
      nichos,
      status,
      regiao,
      instancia_id, // Added instancia_id field
    } = body

    if (!id) {
      return NextResponse.json({ error: "ID do agente é obrigatório" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (nome !== undefined) updateData.nome = nome
    if (descricao_persona !== undefined) updateData.descricao_persona = descricao_persona
    if (produto_servico !== undefined) updateData.produto_servico = produto_servico
    if (tom_voz !== undefined) updateData.tom_voz = tom_voz
    if (objetivo !== undefined) updateData.objetivo = objetivo
    if (informacoes_adicionais !== undefined) updateData.informacoes_adicionais = informacoes_adicionais
    if (ativo !== undefined) updateData.ativo = ativo
    if (horario_inicio !== undefined) updateData.horario_inicio = horario_inicio
    if (limite_mensagens !== undefined) updateData.limite_mensagens = limite_mensagens
    if (nichos !== undefined) updateData.nichos = nichos
    if (status !== undefined) updateData.status = status
    if (regiao !== undefined) updateData.regiao = regiao
    if (instancia_id !== undefined) updateData.instancia_id = instancia_id // Include instancia_id in update

    const { data: agente, error } = await supabase
      .from("agentes_prospeccao")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating agent:", error)
      return NextResponse.json({ error: "Erro ao atualizar agente" }, { status: 500 })
    }

    return NextResponse.json({ agente })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID do agente é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("agentes_prospeccao").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting agent:", error)
      return NextResponse.json({ error: "Erro ao excluir agente" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/agentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
