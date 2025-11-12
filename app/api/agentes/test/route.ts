import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json({ error: "ID do agente é obrigatório" }, { status: 400 })
    }

    const { data: agent, error: agentError } = await supabase
      .from("agentes_prospeccao")
      .select("*, instancias(*)")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single()

    if (agentError || !agent) {
      console.error("[v0] Error fetching agent:", agentError)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    if (!agent.instancia_id) {
      return NextResponse.json({ error: "Agente não possui uma instância associada" }, { status: 400 })
    }

    // Call n8n webhook
    const webhookUrl = "https://n8n.josejusto.com.br/webhook/agentes"

    console.log("[v0] Calling n8n webhook for agent test:", agent.nome)

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
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
        test_mode: true,
      }),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error("[v0] n8n webhook error:", errorText)
      return NextResponse.json({ error: "Erro ao chamar webhook do n8n", details: errorText }, { status: 500 })
    }

    const responseText = await webhookResponse.text()

    // Check if response is empty
    if (!responseText || responseText.trim() === "") {
      console.error("[v0] n8n webhook returned empty response")
      return NextResponse.json(
        {
          error: "Nenhum lead disponível",
          details:
            "Não há leads disponíveis com os filtros selecionados (nichos, status e região). Ajuste os filtros do agente ou adicione novos leads ao sistema.",
          errorType: "no-leads",
        },
        { status: 404 },
      )
    }

    let webhookData
    try {
      // Try to parse as JSON
      webhookData = JSON.parse(responseText)
      console.log("[v0] n8n webhook response:", webhookData)
    } catch (parseError) {
      console.error("[v0] Error parsing webhook response:", parseError)
      return NextResponse.json(
        {
          error: "Erro ao processar resposta do webhook",
          details: "A resposta do n8n não está em formato JSON válido.",
          errorType: "parse-error",
        },
        { status: 500 },
      )
    }

    if (Array.isArray(webhookData) && webhookData.length > 0) {
      const firstResult = webhookData[0]

      // Check if there's an error related to Z-API credentials
      if (firstResult.error) {
        const errorMessage = firstResult.error.message || ""

        // Check for Z-API authentication errors
        if (errorMessage.includes("Client-Token") && errorMessage.includes("not allowed")) {
          return NextResponse.json(
            {
              error: "Credenciais Z-API inválidas",
              details:
                "O token de segurança da instância Z-API está incorreto ou não tem permissão. Verifique as credenciais da instância nas configurações.",
              errorType: "z-api-auth",
              instanceName: agent.instancias?.nome,
            },
            { status: 400 },
          )
        }

        // Check for other Z-API errors (403, 401, etc.)
        if (firstResult.error.status === 403 || firstResult.error.status === 401) {
          return NextResponse.json(
            {
              error: "Erro de autenticação Z-API",
              details:
                "Não foi possível autenticar com a Z-API. Verifique se o token, token de segurança e instance ID estão corretos.",
              errorType: "z-api-auth",
              instanceName: agent.instancias?.nome,
            },
            { status: 400 },
          )
        }

        // Generic error from n8n/Z-API
        return NextResponse.json(
          {
            error: "Erro ao enviar mensagem",
            details: errorMessage,
            errorType: "send-error",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Teste enviado com sucesso",
      webhookResponse: webhookData,
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/agentes/test:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
