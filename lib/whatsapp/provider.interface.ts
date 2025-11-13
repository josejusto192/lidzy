/**
 * WhatsApp Provider Interface
 * Abstraction layer for different WhatsApp providers (Z-API, Baileys, etc)
 */

export interface WhatsAppMessage {
  from: string
  to?: string
  body: string
  timestamp: number
  messageId?: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  media?: {
    url?: string
    mimetype?: string
    caption?: string
  }
}

export interface WhatsAppContact {
  phone: string
  name?: string
  profilePicture?: string
}

export interface WhatsAppInstanceStatus {
  connected: boolean
  status: string
  qrCode?: string
  phone?: string
  battery?: number
  platform?: string
}

export interface WhatsAppProviderConfig {
  apiKey?: string
  apiUrl?: string
  instanceId?: string
  webhookUrl?: string
  [key: string]: any
}

export interface IWhatsAppProvider {
  /**
   * Initialize the provider with configuration
   */
  initialize(config: WhatsAppProviderConfig): Promise<void>

  /**
   * Connect/start the WhatsApp instance
   */
  connect(): Promise<void>

  /**
   * Disconnect/stop the WhatsApp instance
   */
  disconnect(): Promise<void>

  /**
   * Get current instance status
   */
  getStatus(): Promise<WhatsAppInstanceStatus>

  /**
   * Send a text message
   */
  sendMessage(to: string, message: string): Promise<{ messageId: string }>

  /**
   * Send media message (image, video, document, etc)
   */
  sendMedia(to: string, mediaUrl: string, caption?: string): Promise<{ messageId: string }>

  /**
   * Get QR Code for connection
   */
  getQRCode(): Promise<string | null>

  /**
   * Check if instance is connected
   */
  isConnected(): Promise<boolean>

  /**
   * Get contact info
   */
  getContact(phone: string): Promise<WhatsAppContact | null>

  /**
   * Validate phone number
   */
  validatePhone(phone: string): Promise<boolean>
}

export type ProviderType = 'zapi' | 'baileys' | 'evolution'

export interface ProviderFactory {
  create(type: ProviderType): IWhatsAppProvider
}
