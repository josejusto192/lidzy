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

    // Get instance from database
    const { data: instance, error: instanceError } = await supabase
      .from('instancias_whatsapp')
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

    // Check if connected
    const isConnected = await provider.isConnected()
    if (!isConnected) {
      return NextResponse.json({ error: 'Instância não está conectada' }, { status: 400 })
    }

    // Send message
    let result

    if (type === 'text') {
      result = await provider.sendMessage(to, message)
    } else if (type === 'media' && mediaUrl) {
      result = await provider.sendMedia(to, mediaUrl, message)
    } else {
      return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 })
    }

    // Log message in database
    await supabase.from('mensagens').insert({
      user_id: user.id,
      instance_id: instanceId,
      telefone: to,
      mensagem: message,
      tipo: type,
      status: 'sent',
      provider_message_id: result.messageId,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: `Erro ao enviar mensagem: ${error}` }, { status: 500 })
  }
}
