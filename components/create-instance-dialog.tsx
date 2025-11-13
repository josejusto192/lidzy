"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface CreateInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data?: { qrcode?: string; instanceName?: string }) => void
}

export function CreateInstanceDialog({ open, onOpenChange, onSuccess }: CreateInstanceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState("")

  // Evolution API usa configurações do servidor (fixas)
  const evolutionApiUrl = "http://31.97.24.93:7458"
  const evolutionApiKey = "jose1234"

  async function handleSubmit() {
    if (!nome) {
      toast.error("Nome da instância é obrigatório")
      return
    }

    setLoading(true)

    try {
      const config = {
        apiUrl: evolutionApiUrl,
        apiKey: evolutionApiKey,
      }

      const response = await fetch("/api/whatsapp/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          provider: "evolution",
          config,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar instância")
      }

      toast.success("Instância criada com sucesso!")

      // Reset form
      setNome("")

      onOpenChange(false)

      if (onSuccess) {
        // Passar QR code para Evolution API
        const qrcodeRaw = data.qrcode || data.instance?.qrCode

        if (qrcodeRaw) {
          const qrcodeData = qrcodeRaw.base64 || qrcodeRaw.code || qrcodeRaw
          onSuccess({ qrcode: qrcodeData, instanceName: nome })
        } else {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error("Error creating instance:", error)
      toast.error(error.message || "Erro ao criar instância")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Instância WhatsApp</DialogTitle>
          <DialogDescription>
            Conecte uma conta WhatsApp ao Lidzy em segundos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instance Name */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Instância</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: WhatsApp Vendas"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:bg-green-950/20 dark:border-green-900">
            <div className="flex gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Após criar, você receberá um <strong>QR Code</strong> para escanear com seu WhatsApp
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !nome}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Instância"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
