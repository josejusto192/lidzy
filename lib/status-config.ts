export const STATUS_CONTATO = {
  NOVO_LEAD: "novo_lead",
  CONTATO_INICIAL: "contato_inicial",
  EM_CONVERSA: "em_conversa",
  QUALIFICADO: "qualificado",
  PROPOSTA_ENVIADA: "proposta_enviada",
  NEGOCIACAO: "negociacao",
  GANHO: "ganho",
  PERDIDO: "perdido",
  INATIVO: "inativo",
} as const

export type StatusContato = (typeof STATUS_CONTATO)[keyof typeof STATUS_CONTATO]

export const STATUS_CONFIG: Record<
  StatusContato,
  {
    label: string
    color: string
    bgClass: string
  }
> = {
  [STATUS_CONTATO.NOVO_LEAD]: {
    label: "Novo Lead",
    color: "#3b82f6",
    bgClass: "bg-blue-500",
  },
  [STATUS_CONTATO.CONTATO_INICIAL]: {
    label: "Contato Inicial",
    color: "#06b6d4",
    bgClass: "bg-cyan-500",
  },
  [STATUS_CONTATO.EM_CONVERSA]: {
    label: "Em Conversa",
    color: "#a855f7",
    bgClass: "bg-purple-500",
  },
  [STATUS_CONTATO.QUALIFICADO]: {
    label: "Qualificado",
    color: "#eab308",
    bgClass: "bg-yellow-500",
  },
  [STATUS_CONTATO.PROPOSTA_ENVIADA]: {
    label: "Proposta Enviada",
    color: "#f97316",
    bgClass: "bg-orange-500",
  },
  [STATUS_CONTATO.NEGOCIACAO]: {
    label: "Negociação",
    color: "#f59e0b",
    bgClass: "bg-amber-500",
  },
  [STATUS_CONTATO.GANHO]: {
    label: "Ganho",
    color: "#22c55e",
    bgClass: "bg-green-500",
  },
  [STATUS_CONTATO.PERDIDO]: {
    label: "Perdido",
    color: "#ef4444",
    bgClass: "bg-red-500",
  },
  [STATUS_CONTATO.INATIVO]: {
    label: "Inativo",
    color: "#6b7280",
    bgClass: "bg-gray-500",
  },
}

export const STATUS_ORDER: StatusContato[] = Object.keys(STATUS_CONFIG) as StatusContato[]

export const STATUS_LABELS: Record<StatusContato, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, value]) => [key, value.label]),
) as Record<StatusContato, string>

export const STATUS_COLORS: Record<StatusContato, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, value]) => [key, value.bgClass]),
) as Record<StatusContato, string>

// Status que representam leads ativos no funil
export const STATUS_ATIVOS: StatusContato[] = [
  STATUS_CONTATO.NOVO_LEAD,
  STATUS_CONTATO.CONTATO_INICIAL,
  STATUS_CONTATO.EM_CONVERSA,
  STATUS_CONTATO.QUALIFICADO,
  STATUS_CONTATO.PROPOSTA_ENVIADA,
  STATUS_CONTATO.NEGOCIACAO,
]

// Status finais (fora do funil ativo)
export const STATUS_FINAIS: StatusContato[] = [STATUS_CONTATO.GANHO, STATUS_CONTATO.PERDIDO, STATUS_CONTATO.INATIVO]
