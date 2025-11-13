/**
 * WhatsApp Instances API
 * Unified endpoint for managing WhatsApp instances across different providers (Z-API, Evolution)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppProviderFactory } from '@/lib/whatsapp/provider.factory'
import { ProviderType } from '@/lib/whatsapp/provider.interface'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: instances, error } = await supabase
      .from('instancias')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching instances:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get status for each instance
    const instancesWithStatus = await Promise.all(
      (instances || []).map(async (instance) => {
        try {
          const provider = WhatsAppProviderFactory.create(instance.provider as ProviderType)
          await provider.initialize(instance.provider_config)

          const status = await provider.getStatus()

          return {
            ...instance,
            status: {
              connected: status.connected,
              phone: status.phone,
            },
          }
        } catch (error) {
          console.error(`Error getting status for instance ${instance.id}:`, error)
          return {
            ...instance,
            status: {
              connected: false,
            },
          }
        }
      })
    )

    return NextResponse.json({ instances: instancesWithStatus })
  } catch (error) {
    console.error('Error in GET /api/whatsapp/instances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { nome, provider, config } = body

    if (!nome || !provider) {
      return NextResponse.json({ error: 'Nome e provider são obrigatórios' }, { status: 400 })
    }

    // Validate provider type
    const supportedProviders = WhatsAppProviderFactory.getSupportedProviders()
    if (!supportedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Provider inválido. Opções: ${supportedProviders.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate instance ID
    const instanceId = `${user.id}_${Date.now()}`

    // Create provider config based on type
    let providerConfig = {}

    if (provider === 'zapi') {
      providerConfig = {
        instanceId: config.instanceId,
        apiKey: config.apiKey,
        apiUrl: config.apiUrl || 'https://api.z-api.io',
      }
    } else if (provider === 'baileys') {
      providerConfig = {
        instanceId,
        apiUrl: process.env.BAILEYS_SERVICE_URL || 'http://localhost:3001',
        webhookUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
      }
    } else if (provider === 'evolution') {
      providerConfig = {
        instanceId,
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        webhookUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
      }
    }

    // Insert into database
    const { data: instance, error } = await supabase
      .from('instancias')
      .insert({
        user_id: user.id,
        nome,
        tipo: provider === 'zapi' ? 'Z-API' : provider === 'evolution' ? 'Evolution API' : 'Baileys', // backward compatibility
        provider,
        provider_config: providerConfig,
        instance_id: instanceId,
        token: config.apiKey || '',
        token_seguranca: config.apiKey || '',
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating instance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Initialize provider
    try {
      const providerInstance = WhatsAppProviderFactory.create(provider as ProviderType)
      await providerInstance.initialize(providerConfig)
      await providerInstance.connect()

      const status = await providerInstance.getStatus()

      return NextResponse.json({
        instance: {
          ...instance,
          qrCode: status.qrCode,
          connected: status.connected,
        },
      })
    } catch (error) {
      console.error('Error initializing provider:', error)

      // Delete instance from database if initialization failed
      await supabase.from('instancias').delete().eq('id', instance.id)

      return NextResponse.json(
        { error: `Erro ao inicializar provider: ${error}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/whatsapp/instances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
