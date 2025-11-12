import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching dashboard stats...")
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Get total contacts
    const { count: totalContatos } = await supabase
      .from("contatos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get contacts by status
    const { data: contatosPorStatus } = await supabase.from("contatos").select("status").eq("user_id", user.id)

    // Count by status
    const statusCount: Record<string, number> = {}
    contatosPorStatus?.forEach((c) => {
      statusCount[c.status] = (statusCount[c.status] || 0) + 1
    })

    // Get revenue (sum of valor where status = ganho)
    const { data: contatosGanhos } = await supabase
      .from("contatos")
      .select("valor")
      .eq("user_id", user.id)
      .eq("status", "ganho")
      .not("valor", "is", null)

    const faturamento = contatosGanhos?.reduce((sum, c) => sum + (Number(c.valor) || 0), 0) || 0

    const { data: conversas } = await supabase.from("conversas").select("id").eq("user_id", user.id)

    const conversaIds = conversas?.map((c) => c.id) || []

    let totalMensagens = 0
    let mensagensCobradasCount = 0
    const mensagensPorStatus: Record<string, number> = {}
    const mensagensPorDia: Record<string, number> = {}

    if (conversaIds.length > 0) {
      // Total de mensagens enviadas
      const { count } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("from_me", true)
        .in("conversa_id", conversaIds)

      totalMensagens = count || 0

      // Mensagens cobradas (is_billing = true)
      const { count: billingCount } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("from_me", true)
        .eq("is_billing", true)
        .in("conversa_id", conversaIds)

      mensagensCobradasCount = billingCount || 0

      // Mensagens por status
      const { data: mensagensPorStatusData } = await supabase
        .from("mensagens")
        .select("status")
        .eq("from_me", true)
        .in("conversa_id", conversaIds)

      mensagensPorStatusData?.forEach((m) => {
        const status = m.status || "desconhecido"
        mensagensPorStatus[status] = (mensagensPorStatus[status] || 0) + 1
      })

      // Mensagens cobradas por dia (últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: mensagensPorDiaData } = await supabase
        .from("mensagens")
        .select("created_at, is_billing")
        .eq("from_me", true)
        .eq("is_billing", true)
        .in("conversa_id", conversaIds)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true })

      mensagensPorDiaData?.forEach((m) => {
        const date = new Date(m.created_at).toLocaleDateString("pt-BR")
        mensagensPorDia[date] = (mensagensPorDia[date] || 0) + 1
      })
    }

    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: contatosRecentes } = await supabase
      .from("contatos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("criado_em", sevenDaysAgo.toISOString())

    // Get contacts created per day (last 30 days)
    const thirtyDaysAgoContatos = new Date()
    thirtyDaysAgoContatos.setDate(thirtyDaysAgoContatos.getDate() - 30)

    const { data: contatosPorDia } = await supabase
      .from("contatos")
      .select("criado_em")
      .eq("user_id", user.id)
      .gte("criado_em", thirtyDaysAgoContatos.toISOString())
      .order("criado_em", { ascending: true })

    // Group by day
    const contatosPorDiaAgrupados: Record<string, number> = {}
    contatosPorDia?.forEach((c) => {
      const date = new Date(c.criado_em).toLocaleDateString("pt-BR")
      contatosPorDiaAgrupados[date] = (contatosPorDiaAgrupados[date] || 0) + 1
    })

    console.log("[v0] Dashboard stats fetched successfully")

    return NextResponse.json({
      totalContatos: totalContatos || 0,
      contatosPorStatus: statusCount,
      faturamento,
      totalMensagens,
      mensagensCobradasCount,
      mensagensPorStatus,
      mensagensPorDia,
      contatosRecentes: contatosRecentes || 0,
      contatosPorDia: contatosPorDiaAgrupados,
    })
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
  }
}
