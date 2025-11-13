/**
 * Send WhatsApp Message API
 * Unified endpoint for sending messages across different providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppProviderFactory } from '@/lib/whatsapp/provider.factory'
import { ProviderType } from '@/lib/whatsapp/provider.interface'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { instanceId, to, message, mediaUrl, type = 'text' } = body

    if (!instanceId || !to || !message) {
      return NextResponse.json(
        { error: 'instanceId, to e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Clean phone number
    const cleanPhone = to.replace(/[^0-9]/g, '')

    // Get instance from database
    const { data: instance, error: instanceError } = await supabase
      .from('instancias')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', user.id)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    if (!instance.ativo) {
      return NextResponse.json({ error: 'Instância inativa' }, { status: 400 })
    }

    // Initialize provider
    const provider = WhatsAppProviderFactory.create(instance.provider as ProviderType)
    await provider.initialize(instance.provider_config)

    // Send message
    let result

    if (type === 'text') {
      result = await provider.sendMessage(to, message)
    } else if (type === 'media' && mediaUrl) {
      result = await provider.sendMedia(to, mediaUrl, message)
    } else {
      return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 })
    }

    // Check if contact exists, create if not
    let { data: contact } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', cleanPhone)
      .eq('user_id', user.id)
      .single()

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contatos')
        .insert({
          user_id: user.id,
          telefone: cleanPhone,
          nome: cleanPhone,
          origem: 'WhatsApp Evolution API',
        })
        .select('id')
        .single()

      contact = newContact
    }

    // Check if conversation exists for this instance
    let { data: conversation } = await supabase
      .from('conversas')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('instancia_id', instance.id)
      .eq('user_id', user.id)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversas')
        .insert({
          user_id: user.id,
          instancia_id: instance.id,
          contato_id: contact.id,
          phone: cleanPhone,
          chat_name: cleanPhone,
          last_message: message,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .select('id')
        .single()

      conversation = newConversation
    }

    // Save message in database
    await supabase.from('mensagens').insert({
      conversa_id: conversation.id,
      message_id: result.messageId,
      from_me: true,
      message: message,
      status: 'sent',
      timestamp: new Date().toISOString(),
    })

    // Update conversation last message
    await supabase
      .from('conversas')
      .update({
        last_message: message,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: `Erro ao enviar mensagem: ${error}` }, { status: 500 })
  }
}
