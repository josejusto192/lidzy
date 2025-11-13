/**
 * Evolution API Webhook
 * Recebe todos os eventos do Evolution API (mensagens, conexão, QR code, etc)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('=== Evolution API Webhook ===')
    console.log('Event:', body.event)
    console.log('Instance:', body.instance)
    console.log('Data:', JSON.stringify(body.data, null, 2))

    const supabase = await createClient()
    const event = body.event
    const instanceName = body.instance

    if (!instanceName) {
      console.log('No instance name in webhook')
      return NextResponse.json({ success: true })
    }

    // ==================== CONNECTION UPDATE ====================
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      const state = body.data?.state || body.state

      console.log(`Connection update for ${instanceName}: ${state}`)

      await supabase
        .from('instancias')
        .update({
          ativo: state === 'open',
          session_data: {
            connected: state === 'open',
            state: state,
            updated_at: new Date().toISOString()
          }
        })
        .eq('instance_id', instanceName)

      return NextResponse.json({ success: true, message: 'Connection updated' })
    }

    // ==================== QRCODE UPDATED ====================
    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
      const qrcode = body.data?.qrcode || body.qrcode

      console.log(`QR code updated for ${instanceName}`)

      await supabase
        .from('instancias')
        .update({
          session_data: {
            qr: qrcode,
            updated_at: new Date().toISOString()
          }
        })
        .eq('instance_id', instanceName)

      return NextResponse.json({ success: true, message: 'QR code updated' })
    }

    // ==================== MESSAGES UPSERT ====================
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const msgData = body.data

      if (!msgData || !msgData.key || !msgData.message) {
        console.log('Invalid message data')
        return NextResponse.json({ success: true })
      }

      // Ignorar mensagens enviadas por nós
      if (msgData.key.fromMe) {
        console.log('Ignoring message from me')
        return NextResponse.json({ success: true })
      }

      const from = msgData.key.remoteJid
      const messageId = msgData.key.id
      const timestamp = msgData.messageTimestamp

      // Extrair texto da mensagem
      const messageText = msgData.message.conversation ||
                         msgData.message.extendedTextMessage?.text ||
                         msgData.message.imageMessage?.caption ||
                         msgData.message.videoMessage?.caption ||
                         ''

      if (!messageText) {
        console.log('No text message found')
        return NextResponse.json({ success: true })
      }

      // Limpar número de telefone
      const cleanPhone = from.replace(/@.*$/, '').replace(/[^0-9]/g, '')

      console.log(`Message from ${cleanPhone}: ${messageText}`)

      // Buscar instância
      let { data: instance } = await supabase
        .from('instancias')
        .select('id, user_id')
        .eq('instance_id', instanceName)
        .single()

      if (!instance) {
        console.log('Instance not found:', instanceName)
        return NextResponse.json({ success: true })
      }

      // Buscar ou criar contato
      let { data: contact } = await supabase
        .from('contatos')
        .select('id')
        .eq('telefone', cleanPhone)
        .eq('user_id', instance.user_id)
        .single()

      if (!contact) {
        const { data: newContact } = await supabase
          .from('contatos')
          .insert({
            user_id: instance.user_id,
            telefone: cleanPhone,
            nome: cleanPhone,
            origem: 'WhatsApp Evolution API',
          })
          .select('id')
          .single()

        contact = newContact
      }

      if (!contact) {
        console.log('Failed to create contact')
        return NextResponse.json({ success: true })
      }

      // Buscar ou criar conversa
      let { data: conversation } = await supabase
        .from('conversas')
        .select('id, unread_count')
        .eq('phone', cleanPhone)
        .eq('instancia_id', instance.id)
        .eq('user_id', instance.user_id)
        .single()

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from('conversas')
          .insert({
            user_id: instance.user_id,
            instancia_id: instance.id,
            contato_id: contact.id,
            phone: cleanPhone,
            chat_name: cleanPhone,
            last_message: messageText,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select('id, unread_count')
          .single()

        conversation = newConversation
      }

      if (!conversation) {
        console.log('Failed to create conversation')
        return NextResponse.json({ success: true })
      }

      // Salvar mensagem
      await supabase.from('mensagens').insert({
        conversa_id: conversation.id,
        message_id: messageId,
        from_me: false,
        message: messageText,
        status: 'received',
        timestamp: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : new Date().toISOString(),
      })

      // Atualizar conversa
      await supabase
        .from('conversas')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)

      console.log(`Message saved successfully for ${cleanPhone}`)

      return NextResponse.json({ success: true, message: 'Message received' })
    }

    // Outros eventos que podemos ignorar
    console.log(`Ignoring event: ${event}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Evolution webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
