/**
 * Z-API WhatsApp Provider Implementation
 */

import {
  IWhatsAppProvider,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppInstanceStatus,
  WhatsAppProviderConfig,
} from '../provider.interface'

export class ZApiProvider implements IWhatsAppProvider {
  private config: WhatsAppProviderConfig = {}
  private baseUrl: string = ''
  private instanceId: string = ''
  private token: string = ''

  async initialize(config: WhatsAppProviderConfig): Promise<void> {
    this.config = config
    this.instanceId = config.instanceId || ''
    this.token = config.apiKey || ''
    this.baseUrl = config.apiUrl || 'https://api.z-api.io'

    if (!this.instanceId || !this.token) {
      throw new Error('Z-API requires instanceId and apiKey')
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Client-Token': this.token,
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}/instances/${this.instanceId}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Z-API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async connect(): Promise<void> {
    // Z-API doesn't require explicit connect, it's always connected
    // Just verify the instance exists
    await this.getStatus()
  }

  async disconnect(): Promise<void> {
    // Z-API handles disconnection automatically
    // We could call /disconnect endpoint if needed
  }

  async getStatus(): Promise<WhatsAppInstanceStatus> {
    try {
      const data = await this.makeRequest('/status')

      return {
        connected: data.connected || false,
        phone: data.phone,
        battery: data.battery,
        platform: data.platform || 'Z-API',
      }
    } catch (error) {
      return {
        connected: false,
      }
    }
  }

  async sendMessage(to: string, message: string): Promise<{ messageId: string }> {
    const phone = this.normalizePhone(to)

    const data = await this.makeRequest('/send-text', 'POST', {
      phone,
      message,
    })

    return {
      messageId: data.messageId || data.id || '',
    }
  }

  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<{ messageId: string }> {
    const phone = this.normalizePhone(to)

    const data = await this.makeRequest('/send-image', 'POST', {
      phone,
      image: mediaUrl,
      caption,
    })

    return {
      messageId: data.messageId || data.id || '',
    }
  }

  async getQRCode(): Promise<string | null> {
    try {
      const data = await this.makeRequest('/qr-code')
      return data.qrcode || data.value || null
    } catch (error) {
      return null
    }
  }

  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }

  async getContact(phone: string): Promise<WhatsAppContact | null> {
    try {
      const normalizedPhone = this.normalizePhone(phone)
      const data = await this.makeRequest(`/contacts/${normalizedPhone}`)

      return {
        phone: normalizedPhone,
        name: data.name || data.pushname,
        profilePicture: data.profilePicture,
      }
    } catch (error) {
      return null
    }
  }

  async validatePhone(phone: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(phone)
      const data = await this.makeRequest('/phone-exists', 'POST', {
        phone: normalizedPhone,
      })

      return data.exists || false
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

    return cleaned
  }
}
