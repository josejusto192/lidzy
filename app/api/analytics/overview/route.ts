import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get contact stats
    const { count: totalContacts } = await supabase
      .from("contatos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    const { count: newContacts } = await supabase
      .from("contatos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())

    // Get conversation stats
    const { count: totalConversations } = await supabase
      .from("conversas")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    const { count: activeConversations } = await supabase
      .from("conversas")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active")

    // Get message stats
    const { count: totalMessages } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    const { count: sentMessages } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tipo", "sent")
      .gte("created_at", startDate.toISOString())

    const { count: receivedMessages } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tipo", "received")
      .gte("created_at", startDate.toISOString())

    // Get agent stats
    const { data: agents } = await supabase
      .from("agentes_prospeccao")
      .select("id, nome, status, total_contatos_gerados")
      .eq("user_id", user.id)

    const activeAgents = agents?.filter((a) => a.status === "ativo").length || 0
    const totalLeadsGenerated = agents?.reduce((sum, a) => sum + (a.total_contatos_gerados || 0), 0) || 0

    // Get credit usage
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("creditos, creditos_leads_usados, creditos_mensagens_usados")
      .eq("id", user.id)
      .single()

    // Get daily message trends (last 7 days)
    const { data: dailyMessages } = await supabase
      .from("mensagens")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true })

    // Group by day
    const messageTrends: Record<string, { sent: number; received: number }> = {}
    dailyMessages?.forEach((msg: any) => {
      const date = new Date(msg.created_at).toISOString().split("T")[0]
      if (!messageTrends[date]) {
        messageTrends[date] = { sent: 0, received: 0 }
      }
      messageTrends[date][msg.tipo === "sent" ? "sent" : "received"]++
    })

    return NextResponse.json({
      period: { days, startDate: startDate.toISOString() },
      contacts: {
        total: totalContacts || 0,
        new: newContacts || 0,
        growth: totalContacts ? ((newContacts || 0) / (totalContacts || 1)) * 100 : 0,
      },
      conversations: {
        total: totalConversations || 0,
        active: activeConversations || 0,
        activeRate: totalConversations ? ((activeConversations || 0) / (totalConversations || 1)) * 100 : 0,
      },
      messages: {
        total: totalMessages || 0,
        sent: sentMessages || 0,
        received: receivedMessages || 0,
        responseRate: sentMessages ? ((receivedMessages || 0) / (sentMessages || 1)) * 100 : 0,
      },
      agents: {
        total: agents?.length || 0,
        active: activeAgents,
        leadsGenerated: totalLeadsGenerated,
      },
      credits: {
        available: usuario?.creditos || 0,
        usedLeads: usuario?.creditos_leads_usados || 0,
        usedMessages: usuario?.creditos_mensagens_usados || 0,
        total: (usuario?.creditos || 0) + (usuario?.creditos_leads_usados || 0) + (usuario?.creditos_mensagens_usados || 0),
      },
      trends: {
        messages: Object.entries(messageTrends).map(([date, data]) => ({
          date,
          ...data,
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: "Erro ao buscar analytics" }, { status: 500 })
  }
}
