import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: instancias, error } = await supabase
      .from("instancias")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar instâncias:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instancias: instancias || [] })
  } catch (error) {
    console.error("Erro ao buscar instâncias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nome, tipo, instance_id, token, token_seguranca } = body

    if (!nome || !instance_id || !token || !token_seguranca) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const { data: instancia, error } = await supabase
      .from("instancias")
      .insert({
        user_id: user.id,
        nome,
        tipo: tipo || "Z-API",
        instance_id,
        token,
        token_seguranca,
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar instância:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instancia })
  } catch (error) {
    console.error("Erro ao criar instância:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome, tipo, instance_id, token, token_seguranca } = body

    if (!id) {
      return NextResponse.json({ error: "ID da instância é obrigatório" }, { status: 400 })
    }

    const updateData: any = {}
    if (nome !== undefined) updateData.nome = nome
    if (tipo !== undefined) updateData.tipo = tipo
    if (instance_id !== undefined) updateData.instance_id = instance_id
    if (token !== undefined) updateData.token = token
    if (token_seguranca !== undefined) updateData.token_seguranca = token_seguranca

    const { data: instancia, error } = await supabase
      .from("instancias")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar instância:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instancia })
  } catch (error) {
    console.error("Erro ao atualizar instância:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da instância é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("instancias").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Erro ao deletar instância:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar instância:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
