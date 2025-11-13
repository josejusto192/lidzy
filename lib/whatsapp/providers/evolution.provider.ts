import { IWhatsAppProvider, WhatsAppProviderConfig, WhatsAppInstanceStatus, WhatsAppContact } from '../provider.interface'

export class EvolutionProvider implements IWhatsAppProvider {
  private config: WhatsAppProviderConfig | null = null
  private apiUrl: string = ''
  private apiKey: string = ''
  private instanceName: string = ''

  async initialize(config: WhatsAppProviderConfig): Promise<void> {
    this.config = config
    this.apiUrl = config.apiUrl || process.env.EVOLUTION_API_URL || ''
    this.apiKey = config.apiKey || ''
    this.instanceName = config.instanceId || ''

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Evolution API URL and API Key are required')
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    }
  }

  async connect(): Promise<void> {
    try {
      // Preparar payload para criar instância
      // Webhook do Lidzy para receber eventos
      const webhookUrl = this.config?.webhookUrl ||
        (process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/api/webhooks/evolution` :
         'https://lidzy.vercel.app/api/webhooks/evolution')

      const createPayload: any = {
        instanceName: this.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }

      // Adicionar webhook se URL estiver disponível
      if (webhookUrl) {
        createPayload.webhook = {
          url: webhookUrl,
          webhookByEvents: false,  // Usar endpoint único
          webhookBase64: false,    // Não enviar base64 (economizar banda)
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        }
      }

      // Criar instância na Evolution API
      const createResponse = await fetch(`${this.apiUrl}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(createPayload),
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        let errorMessage = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorText
        } catch (e) {
          // Não é JSON, usar texto direto
        }
        throw new Error(`Failed to create Evolution instance: ${errorMessage} (Status: ${createResponse.status})`)
      }

      const createData = await createResponse.json()
      console.log('Evolution instance created:', createData)

      // Conectar instância (obter QR code)
      const connectResponse = await fetch(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!connectResponse.ok) {
        const errorText = await connectResponse.text()
        throw new Error(`Failed to connect Evolution instance: ${errorText} (Status: ${connectResponse.status})`)
      }

      const connectData = await connectResponse.json()
      console.log('Evolution instance connected:', connectData)
    } catch (error) {
      throw new Error(`Evolution API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/instance/logout/${this.instanceName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect Evolution instance')
      }
    } catch (error) {
      console.error('Error disconnecting Evolution instance:', error)
    }
  }

  async getStatus(): Promise<WhatsAppInstanceStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return {
          connected: false,
          status: 'disconnected',
        }
      }

      const data = await response.json()

      return {
        connected: data.state === 'open',
        status: data.state === 'open' ? 'connected' : 'disconnected',
        qrCode: data.state === 'connecting' ? await this.getQRCode() : undefined,
      }
    } catch (error) {
      return {
        connected: false,
        status: 'disconnected',
      }
    }
  }

  async sendMessage(to: string, message: string): Promise<{ messageId: string }> {
    try {
      // Formatar número no padrão internacional
      const formattedNumber = to.replace(/\D/g, '')

      const response = await fetch(`${this.apiUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
          text: message,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to send message: ${error.message || response.statusText}`)
      }

      const data = await response.json()

      return {
        messageId: data.key?.id || data.messageId || 'unknown',
      }
    } catch (error) {
      throw new Error(`Evolution API send message failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<{ messageId: string }> {
    try {
      const formattedNumber = to.replace(/\D/g, '')

      const response = await fetch(`${this.apiUrl}/message/sendMedia/${this.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
          mediatype: 'image',
          media: mediaUrl,
          caption: caption || '',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to send media: ${error.message || response.statusText}`)
      }

      const data = await response.json()

      return {
        messageId: data.key?.id || data.messageId || 'unknown',
      }
    } catch (error) {
      throw new Error(`Evolution API send media failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getQRCode(): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      // Evolution API retorna o QR code em base64
      return data.qrcode?.base64 || data.base64 || null
    } catch (error) {
      console.error('Error getting QR code:', error)
      return null
    }
  }

  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }

  async getContact(phone: string): Promise<WhatsAppContact | null> {
    try {
      const formattedNumber = phone.replace(/\D/g, '')

      const response = await fetch(`${this.apiUrl}/chat/findContact/${this.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
        }),
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      return {
        phone: formattedNumber,
        name: data.name || data.pushName || null,
        isWhatsApp: true,
      }
    } catch (error) {
      return null
    }
  }

  async validatePhone(phone: string): Promise<boolean> {
    try {
      const formattedNumber = phone.replace(/\D/g, '')

      const response = await fetch(`${this.apiUrl}/chat/whatsappNumbers/${this.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          numbers: [formattedNumber],
        }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.length > 0 && data[0].exists
    } catch (error) {
      return false
    }
  }
}
