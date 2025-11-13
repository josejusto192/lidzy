/**
 * WhatsApp Conversations API
 * List conversations for a specific instance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')

    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId é obrigatório' }, { status: 400 })
    }

    // Get conversations for instance
    const { data: conversations, error } = await supabase
      .from('conversas')
      .select(`
        *,
        contatos (
          id,
          nome,
          telefone
        ),
        instancias (
          id,
          nome,
          tipo
        )
      `)
      .eq('instancia_id', instanceId)
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error in GET /api/whatsapp/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
