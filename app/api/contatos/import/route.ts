import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type ContactRow = {
  nome?: string
  email?: string
  telefone?: string
  empresa?: string
  cargo?: string
  cidade?: string
  estado?: string
  pais?: string
  tags?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { contacts } = body as { contacts: ContactRow[] }

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
    }

    const results = {
      total: contacts.length,
      success: 0,
      errors: [] as Array<{ row: number; error: string }>,
    }

    // Process each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const rowNumber = i + 2 // +2 because CSV has header and is 1-indexed

      try {
        // Validate required fields
        if (!contact.nome && !contact.email && !contact.telefone) {
          results.errors.push({
            row: rowNumber,
            error: "Nome, email ou telefone é obrigatório",
          })
          continue
        }

        // Check if contact already exists
        const existingQuery = supabase.from("contatos").select("id").eq("user_id", user.id)

        if (contact.email) {
          existingQuery.eq("email", contact.email)
        } else if (contact.telefone) {
          existingQuery.eq("telefone", contact.telefone)
        }

        const { data: existing } = await existingQuery.single()

        if (existing) {
          results.errors.push({
            row: rowNumber,
            error: "Contato já existe",
          })
          continue
        }

        // Parse tags
        const tags = contact.tags
          ? contact.tags
              .split(";")
              .map((t) => t.trim())
              .filter(Boolean)
          : []

        // Insert contact
        const { error: insertError } = await supabase.from("contatos").insert({
          user_id: user.id,
          nome: contact.nome || null,
          email: contact.email || null,
          telefone: contact.telefone || null,
          empresa: contact.empresa || null,
          cargo: contact.cargo || null,
          cidade: contact.cidade || null,
          estado: contact.estado || null,
          pais: contact.pais || null,
          tags: tags.length > 0 ? tags : null,
          origem: "importacao_csv",
        })

        if (insertError) {
          console.error("Insert error:", insertError)
          results.errors.push({
            row: rowNumber,
            error: insertError.message || "Erro ao inserir",
          })
          continue
        }

        results.success++
      } catch (error) {
        console.error("Row processing error:", error)
        results.errors.push({
          row: rowNumber,
          error: "Erro ao processar linha",
        })
      }
    }

    console.log("[v0] Import completed:", results)

    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json({ error: "Erro ao importar contatos" }, { status: 500 })
  }
}
