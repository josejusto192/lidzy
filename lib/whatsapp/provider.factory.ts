/**
 * WhatsApp Provider Factory
 * Creates the appropriate provider instance based on type
 */

import { IWhatsAppProvider, ProviderType } from './provider.interface'
import { ZApiProvider } from './providers/zapi.provider'
import { BaileysProvider } from './providers/baileys.provider'

export class WhatsAppProviderFactory {
  static create(type: ProviderType): IWhatsAppProvider {
    switch (type) {
      case 'zapi':
        return new ZApiProvider()
      case 'baileys':
        return new BaileysProvider()
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }

  static getSupportedProviders(): ProviderType[] {
    return ['zapi', 'baileys']
  }

  static getProviderName(type: ProviderType): string {
    const names: Record<ProviderType, string> = {
      zapi: 'Z-API (Externo)',
      baileys: 'Baileys (Auto-hospedado)',
    }
    return names[type] || type
  }

  static getProviderDescription(type: ProviderType): string {
    const descriptions: Record<ProviderType, string> = {
      zapi: 'Serviço externo pago, estável e com suporte oficial',
      baileys: 'Conexão direta com WhatsApp, gratuito mas requer servidor próprio',
    }
    return descriptions[type] || ''
  }

  static getProviderFeatures(type: ProviderType): string[] {
    const features: Record<ProviderType, string[]> = {
      zapi: [
        'Conexão estável e confiável',
        'Suporte oficial 24/7',
        'Não requer infraestrutura própria',
        'Webhooks automáticos',
        'Alta disponibilidade',
      ],
      baileys: [
        'Gratuito (sem custos mensais)',
        'Controle total da infraestrutura',
        'Sem limitações de API',
        'Privacidade total dos dados',
        'Código open-source',
      ],
    }
    return features[type] || []
  }
}
