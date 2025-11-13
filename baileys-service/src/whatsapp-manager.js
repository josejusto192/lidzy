/**
 * WhatsApp Manager
 * Manages multiple WhatsApp instances using Baileys
 */

const WhatsAppInstance = require('./whatsapp-instance')
const logger = require('./logger')

class WhatsAppManager {
  constructor() {
    this.instances = new Map()
  }

  async createInstance(instanceId, webhookUrl) {
    if (this.instances.has(instanceId)) {
      logger.info(`Instance ${instanceId} already exists, returning existing`)
      return this.instances.get(instanceId)
    }

    logger.info(`Creating new instance: ${instanceId}`)

    const instance = new WhatsAppInstance(instanceId, webhookUrl)
    await instance.initialize()

    this.instances.set(instanceId, instance)

    return instance
  }

  getInstance(instanceId) {
    return this.instances.get(instanceId) || null
  }

  listInstances() {
    return Array.from(this.instances.keys()).map((id) => {
      const instance = this.instances.get(id)
      return {
        instanceId: id,
        connected: instance.status.connected,
        phone: instance.status.phone,
      }
    })
  }

  async deleteInstance(instanceId) {
    const instance = this.instances.get(instanceId)

    if (instance) {
      await instance.disconnect()
      this.instances.delete(instanceId)
      logger.info(`Instance ${instanceId} deleted`)
    }
  }

  async shutdown() {
    logger.info('Shutting down all instances...')

    for (const [id, instance] of this.instances.entries()) {
      try {
        await instance.disconnect()
        logger.info(`Instance ${id} disconnected`)
      } catch (error) {
        logger.error(`Error disconnecting instance ${id}:`, error)
      }
    }

    this.instances.clear()
    logger.info('All instances shut down')
  }
}

module.exports = WhatsAppManager
