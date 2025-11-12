import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth-utils"

export async function GET() {
  try {
    await requireSuperAdmin()

    const supabase = await createClient()

    const [
      { count: totalUsuarios },
      { count: totalContatos },
      { count: totalProjetos },
      { count: totalConversas }, // Apenas contagem, não conteúdo
      { count: totalAgentes },
      { count: usuariosAtivos },
    ] = await Promise.all([
      supabase.from("usuarios").select("*", { count: "exact", head: true }),
      supabase.from("contatos").select("*", { count: "exact", head: true }),
      supabase.from("projetos").select("*", { count: "exact", head: true }),
      supabase.from("conversas").select("*", { count: "exact", head: true }),
      supabase.from("agentes_prospeccao").select("*", { count: "exact", head: true }),
      supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .gte("atualizado_em", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const { data: contatosPorStatus } = await supabase
      .from("contatos")
      .select("status")
      .then((result) => {
        const statusCount: Record<string, number> = {}
        result.data?.forEach((contato) => {
          statusCount[contato.status] = (statusCount[contato.status] || 0) + 1
        })
        return { data: statusCount }
      })

    // Usuários criados nos últimos 30 dias - apenas datas, não dados pessoais
    const { data: novosUsuarios } = await supabase
      .from("usuarios")
      .select("criado_em")
      .gte("criado_em", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("criado_em", { ascending: true })

    // Usuarios por mês (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: usuariosPorMesData } = await supabase
      .from("usuarios")
      .select("criado_em")
      .gte("criado_em", sixMonthsAgo.toISOString())
      .order("criado_em")

    const mesesMap = new Map<string, number>()
    usuariosPorMesData?.forEach((u: any) => {
      const mes = new Date(u.criado_em).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      mesesMap.set(mes, (mesesMap.get(mes) || 0) + 1)
    })

    const usuariosPorMes = Array.from(mesesMap.entries())
      .map(([mes, total]) => ({ mes, total }))
      .slice(-6)

    // Projetos por status
    const { data: projetosData } = await supabase.from("projetos").select("status").not("status", "is", null)

    const statusMap = new Map<string, number>()
    const statusCores: Record<string, string> = {
      planejamento: "#3b82f6",
      "em andamento": "#22c55e",
      concluido: "#10b981",
      cancelado: "#ef4444",
      pausado: "#f59e0b",
    }

    projetosData?.forEach((p: any) => {
      statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1)
    })

    const projetosPorStatus = Array.from(statusMap.entries()).map(([status, total]) => ({
      status,
      total,
      cor: statusCores[status] || "#6366f1",
    }))

    // Contatos por nicho (top 10)
    const { data: contatosData } = await supabase.from("contatos").select("nicho").not("nicho", "is", null)

    const nichoMap = new Map<string, number>()
    contatosData?.forEach((c: any) => {
      nichoMap.set(c.nicho, (nichoMap.get(c.nicho) || 0) + 1)
    })

    const contatosPorNicho = Array.from(nichoMap.entries())
      .map(([nicho, total]) => ({ nicho, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Créditos totais
    const { data: creditosData } = await supabase.from("usuarios").select("creditos")
    const creditosTotais = creditosData?.reduce((sum, u) => sum + (u.creditos || 0), 0) || 0

    // Média de projetos por usuário
    const mediaProjetosPorUsuario = totalUsuarios && totalUsuarios > 0 ? (totalProjetos || 0) / totalUsuarios : 0

    // Taxa de crescimento (últimos 30 dias vs 30 dias anteriores)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: novosUsuarios30dias } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", thirtyDaysAgo.toISOString())

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { count: novosUsuarios60dias } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", sixtyDaysAgo.toISOString())
      .lt("criado_em", thirtyDaysAgo.toISOString())

    const taxaCrescimento =
      novosUsuarios60dias && novosUsuarios60dias > 0
        ? (((novosUsuarios30dias || 0) - novosUsuarios60dias) / novosUsuarios60dias) * 100
        : 0

    return NextResponse.json({
      stats: {
        totalUsuarios,
        totalContatos,
        totalProjetos,
        totalConversas, // Apenas número, não conteúdo
        totalAgentes,
        usuariosAtivos: usuariosAtivos || 0,
      },
      metrics: {
        usuariosPorMes,
        projetosPorStatus,
        contatosPorNicho,
        creditosTotais,
        mediaProjetosPorUsuario,
        taxaCrescimento,
      },
      lgpdCompliance: "Dados agregados sem acesso a conteúdo de conversas privadas",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
