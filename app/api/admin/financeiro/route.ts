import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth-utils"

export async function GET() {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Créditos usados no mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { data: historicoMes } = await supabase
      .from("historico_creditos")
      .select("quantidade, tipo, user_id")
      .lt("quantidade", 0) // só débitos
      .gte("created_at", inicioMes.toISOString())

    const creditosUsadosMes = historicoMes?.reduce((sum, h) => sum + Math.abs(h.quantidade), 0) ?? 0
    const creditosLeadsMes = historicoMes?.filter(h => h.tipo === "uso_lead").reduce((sum, h) => sum + Math.abs(h.quantidade), 0) ?? 0
    const creditosMensagensMes = historicoMes?.filter(h => h.tipo === "uso_mensagem").reduce((sum, h) => sum + Math.abs(h.quantidade), 0) ?? 0

    // Assinaturas ativas e MRR
    const { data: assinaturas } = await supabase
      .from("assinaturas")
      .select("status, periodo, planos(nome, preco_mensal, preco_anual)")
      .eq("status", "active")

    const mrr = assinaturas?.reduce((sum, a: any) => {
      if (a.periodo === "yearly") return sum + (a.planos?.preco_anual ?? 0) / 12
      return sum + (a.planos?.preco_mensal ?? 0)
    }, 0) ?? 0

    // Uso por usuário no mês
    const usoPorUser: Record<string, number> = {}
    historicoMes?.forEach(h => {
      usoPorUser[h.user_id] = (usoPorUser[h.user_id] ?? 0) + Math.abs(h.quantidade)
    })

    // Top usuários por consumo
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome, email, creditos_leads_usados, creditos_mensagens_usados")

    const topUsuarios = (usuarios ?? [])
      .map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        creditosMes: usoPorUser[u.id] ?? 0,
        custoMes: (usoPorUser[u.id] ?? 0) * 0.006,
      }))
      .filter(u => u.creditosMes > 0)
      .sort((a, b) => b.creditosMes - a.creditosMes)
      .slice(0, 10)

    return NextResponse.json({
      mrr,
      creditosUsadosMes,
      creditosLeadsMes,
      creditosMensagensMes,
      custoApiMes: creditosUsadosMes * 0.006,
      topUsuarios,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
