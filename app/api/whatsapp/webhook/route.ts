/**
 * WhatsApp Webhook API
 * Receives incoming messages from different providers (Z-API, Baileys)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    console.log('Webhook received:', JSON.stringify(body, null, 2))

    // Determine provider based on webhook structure
    let event, instanceId, from, message, messageId, timestamp, provider

    // Evolution API webhook format
    if (body.event === 'messages.upsert' || body.event === 'MESSAGES_UPSERT') {
      event = 'message'
      instanceId = body.instance

      // Extrair dados da mensagem
      const msgData = body.data
      if (msgData && msgData.key && msgData.message) {
        from = msgData.key.remoteJid
        messageId = msgData.key.id
        timestamp = msgData.messageTimestamp

        // Extrair texto da mensagem (pode estar em diferentes formatos)
        message = msgData.message.conversation ||
                 msgData.message.extendedTextMessage?.text ||
                 msgData.message.imageMessage?.caption ||
                 msgData.message.videoMessage?.caption ||
                 ''

        provider = 'evolution'
      }
    }
    // Baileys webhook format
    else if (body.event) {
      event = body.event
      instanceId = body.instanceId
      from = body.from
      message = body.message
      messageId = body.messageId
      timestamp = body.timestamp
      provider = 'baileys'

      // Handle different events
      if (event === 'qr') {
        // Update instance with QR code
        await supabase
          .from('instancias')
          .update({ session_data: { qr: body.qrCode } })
          .eq('provider_config->instanceId', instanceId)

        return NextResponse.json({ success: true })
      }

      if (event === 'connected') {
        // Update instance status
        await supabase
          .from('instancias')
          .update({
            ativo: true,
            session_data: { phone: body.phone, connected: true },
          })
          .eq('provider_config->instanceId', instanceId)

        return NextResponse.json({ success: true })
      }

      if (event === 'logout') {
        // Update instance status
        await supabase
          .from('instancias')
          .update({
            ativo: false,
            session_data: { connected: false },
          })
          .eq('provider_config->instanceId', instanceId)

        return NextResponse.json({ success: true })
      }

      if (event !== 'message') {
        return NextResponse.json({ success: true })
      }
    }
    // Z-API webhook format
    else {
      instanceId = body.instanceId || body.instance
      from = body.phone || body.from
      message = body.text?.message || body.message?.text || body.body
      messageId = body.messageId
      timestamp = body.timestamp || body.messageTimestamp
      provider = 'zapi'
    }

    if (!from || !message) {
      console.log('Missing required fields')
      return NextResponse.json({ success: true })
    }

    // Get instance from database
    const { data: instance } = await supabase
      .from('instancias')
      .select('*, usuarios(id)')
      .eq('provider_config->instanceId', instanceId)
      .single()

    if (!instance) {
      console.log('Instance not found:', instanceId)
      return NextResponse.json({ success: true })
    }

    const userId = instance.user_id

    // Check if contact exists, create if not
    let { data: contact } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', from)
      .eq('user_id', userId)
      .single()

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contatos')
        .insert({
          user_id: userId,
          telefone: from,
          nome: from,
          origem: `WhatsApp ${provider}`,
        })
        .select('id')
        .single()

      contact = newContact
    }

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from('conversas')
      .select('id')
      .eq('contato_id', contact.id)
      .eq('user_id', userId)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversas')
        .insert({
          user_id: userId,
          contato_id: contact.id,
          status: 'ativa',
          canal: 'whatsapp',
        })
        .select('id')
        .single()

      conversation = newConversation
    }

    // Save message
    await supabase.from('mensagens').insert({
      user_id: userId,
      conversa_id: conversation.id,
      contato_id: contact.id,
      mensagem: message,
      tipo: 'recebida',
      canal: 'whatsapp',
      provider_message_id: messageId,
      metadata: {
        provider,
        instanceId,
        timestamp,
      },
    })

    // Update conversation last message
    await supabase
      .from('conversas')
      .update({
        ultima_mensagem: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    console.log(`Message saved from ${from} via ${provider}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
