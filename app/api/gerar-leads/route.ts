import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface SerperPlace {
  title: string
  address?: string
  phoneNumber?: string
  category?: string
  rating?: number
  position?: number
  website?: string
}

interface SerperResponse {
  places: SerperPlace[]
}

function normalizeRegion(region: string): string {
  // Remove extra whitespace and trim
  let normalized = region.trim().replace(/\s+/g, " ")

  // Remove accents and diacritics
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Capitalize first letter of each word (Title Case)
  normalized = normalized
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return normalized
}

function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "")

  // If number already has 13+ digits, it likely already has a country code
  if (cleaned.length >= 13) {
    return cleaned
  }

  // If number has 10-11 digits, it's likely a local number - add Brazil code (55)
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = "55" + cleaned
  }

  // If number already starts with a country code (12-13 digits after adding 55), keep it
  // Validate minimum length (country code + area code + number = 12-13 digits)
  if (cleaned.length < 12 || cleaned.length > 15) {
    return null // Invalid phone number
  }

  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { nicho, regiao, paginas } = await request.json()

    if (!nicho || !regiao) {
      return NextResponse.json({ error: "Nicho e região são obrigatórios" }, { status: 400 })
    }

    const numPaginas = Math.min(Math.max(1, Number.parseInt(paginas) || 1), 10)

    const { data: usuario } = await supabase.from("usuarios").select("creditos").eq("id", user.id).single()

    // Estimar número de leads (aproximadamente 20 leads por página)
    const estimatedLeads = numPaginas * 20

    if (!usuario || usuario.creditos < estimatedLeads) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `Créditos insuficientes. Você precisa de aproximadamente ${estimatedLeads} créditos para gerar ${numPaginas} página(s) de leads. Saldo atual: ${usuario?.creditos || 0} créditos.`,
          required: estimatedLeads,
          current: usuario?.creditos || 0,
        },
        { status: 402 },
      )
    }

    const regiaoNormalizada = normalizeRegion(regiao)

    const requests = Array.from({ length: numPaginas }, (_, i) =>
      fetch("https://google.serper.dev/places", {
        method: "POST",
        headers: {
          "X-API-KEY": "717faf74d9e3b825b5f0de555958ce5964ae8133",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `${nicho} em ${regiaoNormalizada}`,
          gl: "br",
          hl: "pt-br",
          page: (i + 1).toString(),
        }),
      }),
    )

    const responses = await Promise.all(requests)
    const data: SerperResponse[] = await Promise.all(responses.map((res) => res.json()))

    const allPlaces = data.flatMap((response) => response.places || [])

    console.log(`[v0] API retornou ${allPlaces.length} resultados de ${numPaginas} página(s)`)

    const leadsToInsert = allPlaces
      .map((place) => ({
        nome_empresa: place.title,
        telefone: formatPhoneNumber(place.phoneNumber),
        endereco: place.address || null,
        website: place.website || null,
        nicho: place.category || nicho,
        regiao: regiaoNormalizada,
        status: "novo_lead",
        user_id: user.id,
      }))
      .filter((lead) => lead.telefone !== null) // Only keep leads with valid phone numbers

    const uniqueLeadsMap = new Map()
    for (const lead of leadsToInsert) {
      if (!uniqueLeadsMap.has(lead.telefone)) {
        uniqueLeadsMap.set(lead.telefone, lead)
      }
    }
    const uniqueLeads = Array.from(uniqueLeadsMap.values())
    const internalDuplicates = leadsToInsert.length - uniqueLeads.length

    const phoneNumbers = uniqueLeads.map((lead) => lead.telefone)
    const { data: existingContacts } = await supabase
      .from("contatos")
      .select("telefone")
      .in("telefone", phoneNumbers)
      .eq("user_id", user.id)

    const existingPhones = new Set(existingContacts?.map((c) => c.telefone) || [])

    const newLeads = uniqueLeads.filter((lead) => !existingPhones.has(lead.telefone))
    const duplicatesSkipped = leadsToInsert.length - newLeads.length

    console.log(
      `[v0] Total leads: ${leadsToInsert.length}, Internal duplicates: ${internalDuplicates}, New: ${newLeads.length}, Duplicates skipped: ${duplicatesSkipped}`,
    )

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        leads: [],
        message: "Todos os contatos já existem no banco de dados (telefones duplicados).",
        duplicatesSkipped,
      })
    }

    const { data: insertedLeads, error: insertError } = await supabase
      .from("contatos")
      .upsert(newLeads, {
        onConflict: "telefone,user_id",
        ignoreDuplicates: true,
      })
      .select()

    if (insertError) {
      console.error("[v0] Erro ao salvar leads:", insertError)
      if (insertError.code === "PGRST205") {
        return NextResponse.json(
          {
            error: "DATABASE_NOT_SETUP",
            message: "As tabelas do banco de dados ainda não foram criadas. Execute o script SQL primeiro.",
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Erro ao salvar leads no banco de dados" }, { status: 500 })
    }

    const creditsUsed = insertedLeads?.length || 0
    console.log(`[v0] Descontando ${creditsUsed} créditos pelos ${creditsUsed} leads novos inseridos`)

    if (creditsUsed > 0) {
      const creditResponse = await fetch(`${request.nextUrl.origin}/api/creditos/usar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: creditsUsed,
          tipo: "uso_lead",
          descricao: `Geração de ${creditsUsed} leads: ${nicho} em ${regiaoNormalizada}`,
        }),
      })

      if (!creditResponse.ok) {
        console.error("[v0] Erro ao descontar créditos:", await creditResponse.text())
      }
    }

    const leads = insertedLeads.map((lead) => ({
      id: lead.id,
      empresa: lead.nome_empresa,
      telefone: lead.telefone || "Não disponível",
      nicho: lead.nicho,
      status: lead.status,
      endereco: lead.endereco,
      website: lead.website,
    }))

    return NextResponse.json({
      success: true,
      total: leads.length,
      leads,
      duplicatesSkipped,
      creditsUsed,
      message:
        duplicatesSkipped > 0
          ? `${leads.length} novos contatos salvos (${creditsUsed} créditos usados). ${duplicatesSkipped} duplicados ignorados.`
          : `${leads.length} novos contatos salvos (${creditsUsed} créditos usados).`,
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar leads:", error)
    return NextResponse.json({ error: "Erro ao gerar leads. Tente novamente." }, { status: 500 })
  }
}
