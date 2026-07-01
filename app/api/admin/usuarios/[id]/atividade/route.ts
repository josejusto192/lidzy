import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = params

    const [
      { data: usuario },
      { data: historico },
      { count: totalContatos },
      { count: totalProjetos },
      { data: ultimosContatos },
    ] = await Promise.all([
      supabase.from("usuarios").select("id, nome, email, role, status, creditos, creditos_bonus, creditos_leads_usados, creditos_mensagens_usados, criado_em, atualizado_em").eq("id", id).single(),
      supabase.from("historico_creditos").select("tipo, quantidade, saldo_novo, descricao, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
      supabase.from("contatos").select("*", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("projetos").select("*", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("contatos").select("nome_empresa, status, origem, criado_em").eq("user_id", id).order("criado_em", { ascending: false }).limit(5),
    ])

    return NextResponse.json({
      usuario,
      historico,
      stats: {
        totalContatos: totalContatos ?? 0,
        totalProjetos: totalProjetos ?? 0,
      },
      ultimosContatos,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
