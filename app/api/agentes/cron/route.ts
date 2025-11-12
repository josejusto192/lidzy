import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current time in HH:MM format
    const now = new Date()
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const currentHour = brazilTime.getHours().toString().padStart(2, "0")
    const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
    const currentTime = `${currentHour}:${currentMinute}`

    console.log("[v0] Cron job running at (Brazil time):", currentTime)

    // Fetch all active agents that should run at this time
    const { data: agents, error } = await supabase
      .from("agentes_prospeccao")
      .select("*, instancias(*)")
      .eq("ativo", true)
      // .eq("horario_inicio", `${currentHour}:00`) // Uncomment for Pro plan with hourly crons
      .not("instancia_id", "is", null)

    if (error) {
      console.error("[v0] Error fetching agents for cron:", error)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      console.log("[v0] No active agents found")
      return NextResponse.json({
        message: "Nenhum agente ativo encontrado",
        triggered: 0,
        currentTime: currentTime,
        note: "Hobby plan: All active agents run once per day at 9 AM UTC (6 AM Brazil time)",
      })
    }

    console.log(`[v0] Found ${agents.length} active agents to trigger`)

    // Trigger each agent by calling the webhook
    const webhookUrl = "https://n8n.josejusto.com.br/webhook/agentes"
    const results = []

    for (const agent of agents) {
      try {
        console.log(`[v0] Triggering agent: ${agent.nome} (${agent.id})`)

        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: agent.user_id,
            agent_id: agent.id,
            nome: agent.nome,
            descricao_persona: agent.descricao_persona,
            produto_servico: agent.produto_servico,
            tom_voz: agent.tom_voz,
            objetivo: agent.objetivo,
            informacoes_adicionais: agent.informacoes_adicionais,
            horario_inicio: agent.horario_inicio,
            limite_mensagens: agent.limite_mensagens,
            nichos: agent.nichos,
            status: agent.status,
            regiao: agent.regiao,
            ativo: agent.ativo,
            instancia: agent.instancias,
            test_mode: false,
            triggered_by: "cron",
          }),
        })

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json()
          results.push({
            agent_id: agent.id,
            agent_name: agent.nome,
            success: true,
            response: webhookData,
          })
          console.log(`[v0] Successfully triggered agent: ${agent.nome}`)
        } else {
          const errorText = await webhookResponse.text()
          results.push({
            agent_id: agent.id,
            agent_name: agent.nome,
            success: false,
            error: errorText,
          })
          console.error(`[v0] Failed to trigger agent ${agent.nome}:`, errorText)
        }
      } catch (error) {
        console.error(`[v0] Error triggering agent ${agent.nome}:`, error)
        results.push({
          agent_id: agent.id,
          agent_name: agent.nome,
          success: false,
          error: String(error),
        })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      message: `Cron job executado com sucesso`,
      time: currentTime,
      triggered: successCount,
      total: agents.length,
      results,
      note: "Hobby plan: All active agents run once per day at 9 AM UTC (6 AM Brazil time). Upgrade to Pro for hourly scheduling.",
    })
  } catch (error) {
    console.error("[v0] Error in cron job:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
