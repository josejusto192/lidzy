import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    const instanceName = searchParams.get("instanceName")

    if (!instanceName) {
      return NextResponse.json({ error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "http://31.97.24.93:7458"
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "jose1234"

    console.log("[v0] Deletando instância Evolution API:", instanceName)

    const response = await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: evolutionApiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Erro ao deletar instância na Evolution API:", errorText)
      // Continua mesmo com erro para deletar do banco
    }

    // Deletar do banco de dados
    const { error } = await supabase.from("instancias").delete().eq("instance_id", instanceName).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Erro ao deletar instância do banco:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro ao deletar instância:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
