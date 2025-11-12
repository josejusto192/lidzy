import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    console.log("[v0] Z-API webhook received:", JSON.stringify(body, null, 2))

    const { instanceId, phone, fromMe, text, messageId, status, chatName, photo, momment, type } = body

    // Ignorar callbacks de status por enquanto
    if (type === "MessageStatusCallback") {
      // Atualizar status da mensagem
      const { error: updateError } = await supabase.from("mensagens").update({ status }).eq("message_id", messageId)

      if (updateError) {
        console.error("[v0] Error updating message status:", updateError)
      }

      return NextResponse.json({ success: true, message: "Status updated" })
    }

    // Validar dados obrigatórios
    if (!instanceId || !phone || !messageId) {
      return NextResponse.json({ error: "Missing required fields: instanceId, phone, or messageId" }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("[v0] Original phone:", phone, "Normalized phone:", normalizedPhone)

    // Buscar instância para obter user_id
    const { data: instancia, error: instanciaError } = await supabase
      .from("instancias")
      .select("id, user_id")
      .eq("instance_id", instanceId)
      .single()

    if (instanciaError || !instancia) {
      console.error("[v0] Instance not found:", instanceId)
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    console.log("[v0] Looking up contact with normalized phone:", normalizedPhone)
    const { data: allContatos, error: contatosError } = await supabase
      .from("contatos")
      .select("id, telefone")
      .eq("user_id", instancia.user_id)

    let contato_id = null
    if (allContatos && allContatos.length > 0) {
      // Find contact by comparing normalized phone numbers
      const matchingContato = allContatos.find((c) => {
        const normalizedContatoPhone = normalizePhoneNumber(c.telefone)
        console.log(
          "[v0] Comparing:",
          normalizedPhone,
          "with contact phone:",
          c.telefone,
          "normalized:",
          normalizedContatoPhone,
          "match:",
          normalizedPhone === normalizedContatoPhone,
        )
        return normalizedPhone === normalizedContatoPhone
      })

      if (matchingContato) {
        console.log("[v0] Contact found:", matchingContato.id, "with phone:", matchingContato.telefone)
        contato_id = matchingContato.id
      } else {
        console.log("[v0] No matching contact found after checking", allContatos.length, "contacts")
      }
    } else {
      console.log("[v0] No contacts found for user")
      if (contatosError) {
        console.log("[v0] Contact lookup error:", contatosError.message)
      }
    }

    console.log(
      "[v0] Looking up conversation with normalized phone:",
      normalizedPhone,
      "and instancia_id:",
      instancia.id,
    )

    const { data: conversa, error: conversaError } = await supabase
      .from("conversas")
      .upsert(
        {
          user_id: instancia.user_id,
          instancia_id: instancia.id,
          phone: normalizedPhone,
          contato_id,
          chat_name: chatName,
          photo,
          last_message: text?.message || "",
          last_message_at: new Date(momment || Date.now()).toISOString(),
          unread_count: fromMe ? 0 : 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "phone,instancia_id",
          ignoreDuplicates: false,
        },
      )
      .select("id")
      .single()

    if (conversaError) {
      console.error("[v0] Error upserting conversa:", conversaError)
      return NextResponse.json({ error: "Failed to create/update conversation" }, { status: 500 })
    }

    const conversa_id = conversa.id
    console.log("[v0] Conversation upserted:", conversa_id)

    // Inserir mensagem
    const { error: mensagemError } = await supabase.from("mensagens").insert({
      conversa_id,
      message_id: messageId,
      from_me: fromMe,
      message: text?.message || "",
      status: status || "RECEIVED",
      timestamp: new Date(momment || Date.now()).toISOString(),
    })

    if (mensagemError) {
      console.error("[v0] Error inserting message:", mensagemError)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversa_id })
  } catch (error) {
    console.error("[v0] Error processing Z-API webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
