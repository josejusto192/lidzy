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
      const statusReason = body.data?.statusReason || body.statusReason

      console.log(`[Evolution Webhook] Connection update for ${instanceName}:`, {
        state,
        statusReason,
        fullPayload: body
      })

      // Atualizar status no banco
      const updateData: any = {
        ativo: state === 'open',
        updated_at: new Date().toISOString()
      }

      // Manter session_data existente e adicionar novos campos
      const { data: currentInstance } = await supabase
        .from('instancias')
        .select('session_data')
        .eq('instance_id', instanceName)
        .single()

      updateData.session_data = {
        ...(currentInstance?.session_data || {}),
        connected: state === 'open',
        state: state,
        statusReason: statusReason,
        lastConnectionUpdate: new Date().toISOString()
      }

      const { error } = await supabase
        .from('instancias')
        .update(updateData)
        .eq('instance_id', instanceName)

      if (error) {
        console.error('[Evolution Webhook] Error updating instance:', error)
      } else {
        console.log(`[Evolution Webhook] Instance ${instanceName} updated: ativo=${state === 'open'}`)
      }

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
        console.log('[Evolution Webhook] Invalid message data')
        return NextResponse.json({ success: true })
      }

      // Ignorar mensagens enviadas por nós
      if (msgData.key.fromMe) {
        console.log('[Evolution Webhook] Ignoring message from me')
        return NextResponse.json({ success: true })
      }

      const from = msgData.key.remoteJid
      const messageId = msgData.key.id
      const timestamp = msgData.messageTimestamp

      // Extrair pushName (nome do contato no WhatsApp)
      const pushName = msgData.pushName || null

      // Extrair texto da mensagem
      const messageText = msgData.message.conversation ||
                         msgData.message.extendedTextMessage?.text ||
                         msgData.message.imageMessage?.caption ||
                         msgData.message.videoMessage?.caption ||
                         ''

      if (!messageText) {
        console.log('[Evolution Webhook] No text message found, ignoring')
        return NextResponse.json({ success: true })
      }

      // Limpar número de telefone
      const cleanPhone = from.replace(/@.*$/, '').replace(/[^0-9]/g, '')

      console.log(`[Evolution Webhook] Message from ${cleanPhone} (${pushName || 'no name'}): ${messageText.substring(0, 50)}...`)

      // Buscar instância
      let { data: instance } = await supabase
        .from('instancias')
        .select('id, user_id')
        .eq('instance_id', instanceName)
        .single()

      if (!instance) {
        console.log('[Evolution Webhook] Instance not found:', instanceName)
        return NextResponse.json({ success: true })
      }

      // Buscar ou criar contato
      let { data: contact } = await supabase
        .from('contatos')
        .select('id, nome')
        .eq('telefone', cleanPhone)
        .eq('user_id', instance.user_id)
        .single()

      if (!contact) {
        const { data: newContact } = await supabase
          .from('contatos')
          .insert({
            user_id: instance.user_id,
            telefone: cleanPhone,
            nome: pushName || cleanPhone,
            origem: 'WhatsApp Evolution API',
          })
          .select('id, nome')
          .single()

        contact = newContact
        console.log('[Evolution Webhook] Created new contact:', contact?.id)
      } else if (pushName && contact.nome === cleanPhone) {
        // Atualizar nome do contato se ele ainda estiver com o telefone
        await supabase
          .from('contatos')
          .update({ nome: pushName })
          .eq('id', contact.id)
        console.log('[Evolution Webhook] Updated contact name to:', pushName)
      }

      if (!contact) {
        console.log('[Evolution Webhook] Failed to create contact')
        return NextResponse.json({ success: true })
      }

      // Buscar ou criar conversa
      let { data: conversation } = await supabase
        .from('conversas')
        .select('id, unread_count, chat_name')
        .eq('phone', cleanPhone)
        .eq('instancia_id', instance.id)
        .eq('user_id', instance.user_id)
        .single()

      const chatName = pushName || contact.nome || cleanPhone

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from('conversas')
          .insert({
            user_id: instance.user_id,
            instancia_id: instance.id,
            contato_id: contact.id,
            phone: cleanPhone,
            chat_name: chatName,
            last_message: messageText,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select('id, unread_count, chat_name')
          .single()

        conversation = newConversation
        console.log('[Evolution Webhook] Created new conversation:', conversation?.id)
      } else if (pushName && conversation.chat_name === cleanPhone) {
        // Atualizar chat_name se ainda estiver com o telefone
        await supabase
          .from('conversas')
          .update({ chat_name: chatName })
          .eq('id', conversation.id)
        console.log('[Evolution Webhook] Updated conversation chat_name to:', chatName)
      }

      if (!conversation) {
        console.log('[Evolution Webhook] Failed to create conversation')
        return NextResponse.json({ success: true })
      }

      // Salvar mensagem
      const { error: msgError } = await supabase.from('mensagens').insert({
        conversa_id: conversation.id,
        message_id: messageId,
        from_me: false,
        message: messageText,
        status: 'received',
        timestamp: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : new Date().toISOString(),
      })

      if (msgError) {
        console.error('[Evolution Webhook] Error saving message:', msgError)
      }

      // Atualizar conversa
      const { error: updateError } = await supabase
        .from('conversas')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)

      if (updateError) {
        console.error('[Evolution Webhook] Error updating conversation:', updateError)
      }

      console.log(`[Evolution Webhook] ✅ Message saved successfully for ${cleanPhone}`)

      return NextResponse.json({ success: true, message: 'Message received and saved' })
    }

    // Outros eventos que podemos ignorar
    console.log(`Ignoring event: ${event}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Evolution webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
