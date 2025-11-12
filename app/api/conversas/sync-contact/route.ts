import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getPhoneVariations } from "@/lib/phone-utils"

export async function POST(request: Request) {
  try {
    const { conversaId } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: conversa, error: conversaError } = await supabase
      .from("conversas")
      .select("id, phone, contato_id, user_id")
      .eq("id", conversaId)
      .eq("user_id", user.id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    if (conversa.contato_id) {
      return NextResponse.json({ success: true, alreadyLinked: true })
    }

    console.log("[v0] Original conversation phone:", conversa.phone)
    const phoneVariations = getPhoneVariations(conversa.phone)
    console.log("[v0] Phone variations to try:", phoneVariations)

    const { data: contatos } = await supabase.from("contatos").select("id, telefone").eq("user_id", user.id)

    let matchedContatoId = null
    if (contatos) {
      console.log("[v0] Checking", contatos.length, "contacts for match")
      for (const contato of contatos) {
        const contatoVariations = getPhoneVariations(contato.telefone)

        // Check if any variation matches
        let matched = false
        for (const phoneVar of phoneVariations) {
          for (const contatoVar of contatoVariations) {
            if (phoneVar === contatoVar) {
              matched = true
              console.log("[v0] ✓ MATCH FOUND:", contato.telefone, "matches", conversa.phone)
              console.log("[v0]   Matched variation:", phoneVar)
              break
            }
          }
          if (matched) break
        }

        if (matched) {
          matchedContatoId = contato.id
          break
        }
      }
    }

    if (matchedContatoId) {
      const { error: updateError } = await supabase
        .from("conversas")
        .update({ contato_id: matchedContatoId })
        .eq("id", conversaId)

      if (updateError) {
        console.error("[v0] Error linking contact:", updateError)
        return NextResponse.json({ error: "Erro ao vincular contato" }, { status: 500 })
      }

      console.log("[v0] Successfully linked conversation to contact")
      return NextResponse.json({ success: true, linked: true, contatoId: matchedContatoId })
    }

    console.log("[v0] No matching contact found")
    return NextResponse.json({ success: true, linked: false })
  } catch (error) {
    console.error("[v0] Error syncing contact:", error)
    return NextResponse.json({ error: "Erro ao sincronizar contato" }, { status: 500 })
  }
}
