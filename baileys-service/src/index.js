/**
 * Baileys WhatsApp Service
 * Microservice that manages WhatsApp connections using Baileys
 */

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const WhatsAppManager = require('./whatsapp-manager')
const logger = require('./logger')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// WhatsApp Manager instance
const waManager = new WhatsAppManager()

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Create new WhatsApp instance
app.post('/instances', async (req, res) => {
  try {
    const { instanceId, webhookUrl } = req.body

    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId is required' })
    }

    const instance = await waManager.createInstance(instanceId, webhookUrl)

    res.json({
      instanceId,
      connected: instance.status.connected,
      qrCode: instance.status.qr,
      message: 'Instance created successfully',
    })
  } catch (error) {
    logger.error('Error creating instance:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get instance status
app.get('/instances/:instanceId/status', async (req, res) => {
  try {
    const { instanceId } = req.params
    const instance = waManager.getInstance(instanceId)

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    const status = await instance.getStatus()

    res.json({
      instanceId,
      connected: status.connected,
      qrCode: status.qr,
      phone: status.phone,
    })
  } catch (error) {
    logger.error('Error getting status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Send message
app.post('/instances/:instanceId/send', async (req, res) => {
  try {
    const { instanceId } = req.params
    const { to, type, message } = req.body

    const instance = waManager.getInstance(instanceId)

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    if (!instance.status.connected) {
      return res.status(400).json({ error: 'Instance not connected' })
    }

    let result

    switch (type) {
      case 'text':
        result = await instance.sendText(to, message.text)
        break
      case 'image':
        result = await instance.sendImage(to, message.url, message.caption)
        break
      case 'video':
        result = await instance.sendVideo(to, message.url, message.caption)
        break
      case 'document':
        result = await instance.sendDocument(to, message.url, message.filename)
        break
      default:
        return res.status(400).json({ error: 'Invalid message type' })
    }

    res.json({
      success: true,
      messageId: result.key.id,
      key: result.key,
    })
  } catch (error) {
    logger.error('Error sending message:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get contact info
app.get('/instances/:instanceId/contacts/:phone', async (req, res) => {
  try {
    const { instanceId, phone } = req.params
    const instance = waManager.getInstance(instanceId)

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    const contact = await instance.getContact(phone)

    res.json(contact)
  } catch (error) {
    logger.error('Error getting contact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Validate phone number
app.post('/instances/:instanceId/validate', async (req, res) => {
  try {
    const { instanceId } = req.params
    const { phone } = req.body

    const instance = waManager.getInstance(instanceId)

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    const isValid = await instance.validatePhone(phone)

    res.json({ phone, valid: isValid, exists: isValid })
  } catch (error) {
    logger.error('Error validating phone:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete instance
app.delete('/instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params

    await waManager.deleteInstance(instanceId)

    res.json({ success: true, message: 'Instance deleted' })
  } catch (error) {
    logger.error('Error deleting instance:', error)
    res.status(500).json({ error: error.message })
  }
})

// List all instances
app.get('/instances', (req, res) => {
  const instances = waManager.listInstances()
  res.json({ instances })
})

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Baileys service running on port ${PORT}`)
  logger.info(`📱 WhatsApp instances ready to connect`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...')
  await waManager.shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...')
  await waManager.shutdown()
  process.exit(0)
})
