import { createClient } from "@/lib/supabase/server"
import { normalizePhoneNumber } from "@/lib/phone-utils"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[v0] Iniciando correção de associações para user:", user.id)

    // Buscar todas as conversas do usuário sem contato_id
    const { data: conversas, error: conversasError } = await supabase
      .from("conversas")
      .select("id, phone, contato_id")
      .eq("user_id", user.id)
      .is("contato_id", null)

    if (conversasError) {
      console.error("[v0] Erro ao buscar conversas:", conversasError)
      return NextResponse.json({ error: conversasError.message }, { status: 500 })
    }

    console.log("[v0] Conversas sem contato_id:", conversas?.length || 0)

    // Buscar todos os contatos do usuário
    const { data: contatos, error: contatosError } = await supabase
      .from("contatos")
      .select("id, telefone, nome_empresa")
      .eq("user_id", user.id)

    if (contatosError) {
      console.error("[v0] Erro ao buscar contatos:", contatosError)
      return NextResponse.json({ error: contatosError.message }, { status: 500 })
    }

    console.log("[v0] Total de contatos:", contatos?.length || 0)

    // Criar mapa de telefones normalizados para contatos
    const contatoMap = new Map()
    contatos?.forEach((contato) => {
      const normalized = normalizePhoneNumber(contato.telefone)
      console.log(`[v0] Contato: ${contato.nome_empresa} | Original: ${contato.telefone} | Normalizado: ${normalized}`)
      contatoMap.set(normalized, contato)
    })

    // Tentar associar cada conversa
    let updated = 0
    let notFound = 0
    const updates = []

    for (const conversa of conversas || []) {
      const normalizedPhone = normalizePhoneNumber(conversa.phone)
      console.log(`[v0] Conversa ${conversa.id} | Original: ${conversa.phone} | Normalizado: ${normalizedPhone}`)

      const contato = contatoMap.get(normalizedPhone)

      if (contato) {
        console.log(`[v0] MATCH! Conversa ${conversa.id} -> Contato ${contato.id} (${contato.nome_empresa})`)
        updates.push({
          id: conversa.id,
          contato_id: contato.id,
        })
        updated++
      } else {
        console.log(`[v0] SEM MATCH para conversa ${conversa.id} com telefone ${normalizedPhone}`)
        notFound++
      }
    }

    // Executar updates em batch
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("conversas")
          .update({ contato_id: update.contato_id })
          .eq("id", update.id)

        if (updateError) {
          console.error(`[v0] Erro ao atualizar conversa ${update.id}:`, updateError)
        }
      }
    }

    const result = {
      total_conversas: conversas?.length || 0,
      total_contatos: contatos?.length || 0,
      associacoes_criadas: updated,
      sem_correspondencia: notFound,
      detalhes: {
        conversas_processadas: conversas?.map((c) => ({
          id: c.id,
          phone_original: c.phone,
          phone_normalizado: normalizePhoneNumber(c.phone),
        })),
        contatos_disponiveis: contatos?.map((c) => ({
          id: c.id,
          telefone_original: c.telefone,
          telefone_normalizado: normalizePhoneNumber(c.telefone),
          nome: c.nome_empresa,
        })),
      },
    }

    console.log("[v0] Resultado final:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Erro geral:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
