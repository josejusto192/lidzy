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
    // Evolution API - Connection Update
    else if (body.event === 'connection.update' || body.event === 'CONNECTION_UPDATE') {
      instanceId = body.instance
      const connectionState = body.data?.state || body.state

      console.log(`Evolution API connection update for ${instanceId}:`, connectionState)

      // Atualizar status no banco
      await supabase
        .from('instancias')
        .update({
          ativo: connectionState === 'open',
          session_data: {
            connected: connectionState === 'open',
            state: connectionState,
            updated_at: new Date().toISOString()
          }
        })
        .eq('instance_id', instanceId)

      return NextResponse.json({ success: true })
    }
    // Evolution API - QR Code Update
    else if (body.event === 'qrcode.updated' || body.event === 'QRCODE_UPDATED') {
      instanceId = body.instance

      console.log(`Evolution API QR code updated for ${instanceId}`)

      // Atualizar QR code no banco
      await supabase
        .from('instancias')
        .update({
          session_data: {
            qr: body.data?.qrcode || body.qrcode,
            updated_at: new Date().toISOString()
          }
        })
        .eq('instance_id', instanceId)

      return NextResponse.json({ success: true })
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

    // Limpar número de telefone (remover @s.whatsapp.net, etc)
    const cleanPhone = from.replace(/@.*$/, '').replace(/[^0-9]/g, '')

    // Get instance from database - buscar por instance_id ou provider_config->instanceId
    let { data: instance } = await supabase
      .from('instancias')
      .select('*, usuarios(id)')
      .eq('instance_id', instanceId)
      .single()

    // Se não encontrar, tentar pelo provider_config
    if (!instance) {
      const { data: instanceByConfig } = await supabase
        .from('instancias')
        .select('*, usuarios(id)')
        .eq('provider_config->instanceId', instanceId)
        .single()

      instance = instanceByConfig
    }

    if (!instance) {
      console.log('Instance not found:', instanceId)
      return NextResponse.json({ success: true })
    }

    const userId = instance.user_id

    // Check if contact exists, create if not
    let { data: contact } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', cleanPhone)
      .eq('user_id', userId)
      .single()

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contatos')
        .insert({
          user_id: userId,
          telefone: cleanPhone,
          nome: cleanPhone,
          origem: `WhatsApp Evolution API`,
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
      .eq('user_id', userId)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversas')
        .insert({
          user_id: userId,
          instancia_id: instance.id,
          contato_id: contact.id,
          phone: cleanPhone,
          chat_name: cleanPhone,
          last_message: message,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select('id')
        .single()

      conversation = newConversation
    }

    // Save message
    await supabase.from('mensagens').insert({
      conversa_id: conversation.id,
      message_id: messageId || `${Date.now()}-${cleanPhone}`,
      from_me: false,
      message: message,
      status: 'received',
      timestamp: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : new Date().toISOString(),
    })

    // Update conversation last message and increment unread
    await supabase
      .from('conversas')
      .update({
        last_message: message,
        last_message_at: new Date().toISOString(),
        unread_count: supabase.raw('unread_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    console.log(`Message saved from ${cleanPhone} (${from}) via ${provider}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
