/**
 * WhatsApp Messages API
 * List messages for a specific conversation
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
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId é obrigatório' }, { status: 400 })
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversas')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Get messages for conversation
    const { data: messages, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversationId)
      .order('timestamp', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark messages as read (reset unread count)
    await supabase
      .from('conversas')
      .update({ unread_count: 0 })
      .eq('id', conversationId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error in GET /api/whatsapp/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
