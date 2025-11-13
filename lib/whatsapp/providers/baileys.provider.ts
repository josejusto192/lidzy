/**
 * Baileys WhatsApp Provider Implementation
 * This provider connects directly to WhatsApp using @whiskeysockets/baileys
 */

import {
  IWhatsAppProvider,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppInstanceStatus,
  WhatsAppProviderConfig,
} from '../provider.interface'

// Import types (actual implementation will be in a separate service)
interface BaileysSession {
  qr?: string
  connected: boolean
  phone?: string
  sessionData?: any
}

export class BaileysProvider implements IWhatsAppProvider {
  private config: WhatsAppProviderConfig = {}
  private instanceId: string = ''
  private serviceUrl: string = ''
  private session: BaileysSession = { connected: false }

  async initialize(config: WhatsAppProviderConfig): Promise<void> {
    this.config = config
    this.instanceId = config.instanceId || ''
    this.serviceUrl = config.apiUrl || process.env.BAILEYS_SERVICE_URL || 'http://localhost:3001'

    if (!this.instanceId) {
      throw new Error('Baileys requires instanceId')
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.serviceUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Baileys service error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async connect(): Promise<void> {
    try {
      const data = await this.makeRequest('/instances', 'POST', {
        instanceId: this.instanceId,
        webhookUrl: this.config.webhookUrl,
      })

      this.session = {
        connected: data.connected || false,
        qr: data.qrCode,
        phone: data.phone,
      }
    } catch (error) {
      console.error('Baileys connect error:', error)
      throw new Error(`Failed to connect Baileys instance: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.makeRequest(`/instances/${this.instanceId}`, 'DELETE')
      this.session = { connected: false }
    } catch (error) {
      console.error('Baileys disconnect error:', error)
    }
  }

  async getStatus(): Promise<WhatsAppInstanceStatus> {
    try {
      const data = await this.makeRequest(`/instances/${this.instanceId}/status`)

      this.session = {
        connected: data.connected || false,
        qr: data.qrCode,
        phone: data.phone,
      }

      return {
        connected: data.connected || false,
        qrCode: data.qrCode,
        phone: data.phone,
        platform: 'Baileys',
      }
    } catch (error) {
      return {
        connected: false,
        platform: 'Baileys',
      }
    }
  }

  async sendMessage(to: string, message: string): Promise<{ messageId: string }> {
    const phone = this.normalizePhone(to)

    const data = await this.makeRequest(`/instances/${this.instanceId}/send`, 'POST', {
      to: phone,
      type: 'text',
      message: {
        text: message,
      },
    })

    return {
      messageId: data.key?.id || data.messageId || '',
    }
  }

  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<{ messageId: string }> {
    const phone = this.normalizePhone(to)

    const data = await this.makeRequest(`/instances/${this.instanceId}/send`, 'POST', {
      to: phone,
      type: 'image',
      message: {
        url: mediaUrl,
        caption,
      },
    })

    return {
      messageId: data.key?.id || data.messageId || '',
    }
  }

  async getQRCode(): Promise<string | null> {
    const status = await this.getStatus()
    return status.qrCode || null
  }

  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }

  async getContact(phone: string): Promise<WhatsAppContact | null> {
    try {
      const normalizedPhone = this.normalizePhone(phone)
      const data = await this.makeRequest(`/instances/${this.instanceId}/contacts/${normalizedPhone}`)

      return {
        phone: normalizedPhone,
        name: data.name || data.pushName || data.notify,
        profilePicture: data.profilePicture,
      }
    } catch (error) {
      return null
    }
  }

  async validatePhone(phone: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(phone)
      const data = await this.makeRequest(`/instances/${this.instanceId}/validate`, 'POST', {
        phone: normalizedPhone,
      })

      return data.exists || data.valid || false
    } catch (error) {
      return false
    }
  }

  private normalizePhone(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')

    // Add country code if missing (assuming Brazil +55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned
    }

    // Format for WhatsApp: phone@s.whatsapp.net
    return `${cleaned}@s.whatsapp.net`
  }
}
