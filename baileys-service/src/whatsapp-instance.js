/**
 * WhatsApp Instance
 * Manages a single WhatsApp connection using Baileys
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const path = require('path')
const logger = require('./logger')

class WhatsAppInstance {
  constructor(instanceId, webhookUrl) {
    this.instanceId = instanceId
    this.webhookUrl = webhookUrl
    this.sock = null
    this.status = {
      connected: false,
      qr: null,
      phone: null,
    }
    this.authPath = path.join(__dirname, '../auth', instanceId)
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath)
      const { version } = await fetchLatestBaileysVersion()

      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger,
        browser: ['Lidzy', 'Chrome', '1.0.0'],
        getMessage: async (key) => {
          return { conversation: '' }
        },
      })

      // Save credentials on update
      this.sock.ev.on('creds.update', saveCreds)

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update)
      })

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        await this.handleIncomingMessages(messages, type)
      })

      logger.info(`Instance ${this.instanceId} initialized`)
    } catch (error) {
      logger.error(`Error initializing instance ${this.instanceId}:`, error)
      throw error
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Generate QR code
      try {
        const qrString = await QRCode.toDataURL(qr)
        this.status.qr = qrString
        logger.info(`QR Code generated for ${this.instanceId}`)

        // Send QR to webhook if configured
        if (this.webhookUrl) {
          await this.sendWebhook({
            event: 'qr',
            instanceId: this.instanceId,
            qrCode: qrString,
          })
        }
      } catch (error) {
        logger.error('Error generating QR code:', error)
      }
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      logger.info(`Connection closed for ${this.instanceId}. Should reconnect: ${shouldReconnect}`)

      this.status.connected = false
      this.status.qr = null

      if (shouldReconnect) {
        logger.info(`Reconnecting ${this.instanceId}...`)
        setTimeout(() => this.initialize(), 5000)
      } else {
        logger.info(`${this.instanceId} logged out, not reconnecting`)

        // Notify logout
        if (this.webhookUrl) {
          await this.sendWebhook({
            event: 'logout',
            instanceId: this.instanceId,
          })
        }
      }
    }

    if (connection === 'open') {
      this.status.connected = true
      this.status.qr = null

      // Get phone number
      const me = this.sock.user
      if (me) {
        this.status.phone = me.id.split(':')[0]
      }

      logger.info(`✅ Instance ${this.instanceId} connected! Phone: ${this.status.phone}`)

      // Notify connection
      if (this.webhookUrl) {
        await this.sendWebhook({
          event: 'connected',
          instanceId: this.instanceId,
          phone: this.status.phone,
        })
      }
    }
  }

  async handleIncomingMessages(messages, type) {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue

      const from = msg.key.remoteJid
      const messageType = Object.keys(msg.message)[0]
      let text = ''

      // Extract message text
      if (msg.message.conversation) {
        text = msg.message.conversation
      } else if (msg.message.extendedTextMessage) {
        text = msg.message.extendedTextMessage.text
      } else if (msg.message.imageMessage) {
        text = msg.message.imageMessage.caption || ''
      }

      const messageData = {
        event: 'message',
        instanceId: this.instanceId,
        from: from.replace('@s.whatsapp.net', ''),
        messageId: msg.key.id,
        timestamp: msg.messageTimestamp,
        type: messageType,
        message: text,
        pushName: msg.pushName,
      }

      logger.info(`📨 Message received on ${this.instanceId} from ${from}`)

      // Send to webhook
      if (this.webhookUrl) {
        await this.sendWebhook(messageData)
      }
    }
  }

  async sendWebhook(data) {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (error) {
      logger.error(`Error sending webhook for ${this.instanceId}:`, error)
    }
  }

  async sendText(to, text) {
    if (!this.sock || !this.status.connected) {
      throw new Error('Instance not connected')
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`

    return await this.sock.sendMessage(jid, { text })
  }

  async sendImage(to, url, caption) {
    if (!this.sock || !this.status.connected) {
      throw new Error('Instance not connected')
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`

    return await this.sock.sendMessage(jid, {
      image: { url },
      caption,
    })
  }

  async sendVideo(to, url, caption) {
    if (!this.sock || !this.status.connected) {
      throw new Error('Instance not connected')
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`

    return await this.sock.sendMessage(jid, {
      video: { url },
      caption,
    })
  }

  async sendDocument(to, url, filename) {
    if (!this.sock || !this.status.connected) {
      throw new Error('Instance not connected')
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`

    return await this.sock.sendMessage(jid, {
      document: { url },
      fileName: filename,
    })
  }

  async getContact(phone) {
    if (!this.sock || !this.status.connected) {
      throw new Error('Instance not connected')
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`

    try {
      const contact = await this.sock.onWhatsApp(jid)

      if (contact && contact.length > 0) {
        return {
          phone: contact[0].jid.split('@')[0],
          exists: contact[0].exists,
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting contact:', error)
      return null
    }
  }

  async validatePhone(phone) {
    try {
      const contact = await this.getContact(phone)
      return contact ? contact.exists : false
    } catch (error) {
      return false
    }
  }

  async getStatus() {
    return {
      connected: this.status.connected,
      qr: this.status.qr,
      phone: this.status.phone,
    }
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout()
      this.sock = null
      this.status = {
        connected: false,
        qr: null,
        phone: null,
      }
      logger.info(`Instance ${this.instanceId} disconnected`)
    }
  }
}

module.exports = WhatsAppInstance
