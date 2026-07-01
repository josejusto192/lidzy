"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Globe, User, Bot, Upload, Zap, MessageSquare, Building2 } from "lucide-react"
import { toast } from "sonner"

const ORIGEM_OPTIONS = [
  { value: "casa_dos_dados", label: "Receita Federal (CNPJ)", icon: Building2, color: "bg-blue-600" },
  { value: "google_maps", label: "Google Maps", icon: Globe, color: "bg-red-500" },
  { value: "serper", label: "Google Maps", icon: Globe, color: "bg-red-500" },
  { value: "manual", label: "Manual", icon: User, color: "bg-gray-500" },
  { value: "importacao", label: "Importação CSV", icon: Upload, color: "bg-green-500" },
  { value: "agente_ia", label: "Agente IA", icon: Bot, color: "bg-orange-500" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "bg-emerald-500" },
  { value: "api", label: "API", icon: Zap, color: "bg-yellow-500" },
  { value: "scraping", label: "Scraping", icon: Globe, color: "bg-purple-500" },
]

interface ContactOriginSelectorProps {
  contactId: string
  currentOrigin?: string
  onOriginChange?: () => void
  readOnly?: boolean
}

export function ContactOriginSelector({
  contactId,
  currentOrigin = "manual",
  onOriginChange,
  readOnly,
}: ContactOriginSelectorProps) {
  const selectedOption = ORIGEM_OPTIONS.find((opt) => opt.value === currentOrigin) || ORIGEM_OPTIONS[0]
  const Icon = selectedOption.icon

  const handleOriginChange = async (newOrigin: string) => {
    try {
      const response = await fetch(`/api/contatos/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: newOrigin }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Origem atualizada com sucesso")
        onOriginChange?.()
      } else {
        throw new Error(data.error || "Erro ao atualizar origem")
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar origem:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar origem")
    }
  }

  if (readOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Origem do Contato</Label>
        <Badge className={`${selectedOption.color} text-white`}>
          <Icon className="h-3 w-3 mr-1" />
          {selectedOption.label}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Origem do Contato</Label>
      <Select value={currentOrigin} onValueChange={handleOriginChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORIGEM_OPTIONS.map((option) => {
            const OptionIcon = option.icon
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <OptionIcon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
