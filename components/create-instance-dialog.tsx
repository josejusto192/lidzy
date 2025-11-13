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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, Server, Check } from "lucide-react"
import { toast } from "sonner"

interface CreateInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data?: { qrcode?: string; instanceName?: string }) => void
}

export function CreateInstanceDialog({ open, onOpenChange, onSuccess }: CreateInstanceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<"zapi" | "evolution">("evolution")
  const [nome, setNome] = useState("")

  // Z-API config
  const [zapiInstanceId, setZapiInstanceId] = useState("")
  const [zapiApiKey, setZapiApiKey] = useState("")

  // Evolution API usa configurações do servidor (fixas)
  const evolutionApiUrl = "http://31.97.24.93:7458"
  const evolutionApiKey = "jose1234"

  async function handleSubmit() {
    if (!nome) {
      toast.error("Nome é obrigatório")
      return
    }

    if (provider === "zapi" && (!zapiInstanceId || !zapiApiKey)) {
      toast.error("Instance ID e API Key são obrigatórios para Z-API")
      return
    }

    setLoading(true)

    try {
      let config = {}

      if (provider === "zapi") {
        config = {
          instanceId: zapiInstanceId,
          apiKey: zapiApiKey,
        }
      } else if (provider === "evolution") {
        config = {
          apiUrl: evolutionApiUrl,
          apiKey: evolutionApiKey,
        }
      }

      const response = await fetch("/api/whatsapp/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          provider,
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
      setZapiInstanceId("")
      setZapiApiKey("")

      onOpenChange(false)

      if (onSuccess) {
        // Passar QR code para Evolution API
        // Suporta diferentes formatos de resposta: data.qrcode, data.instance.qrCode
        const qrcodeRaw = data.qrcode || data.instance?.qrCode

        if (provider === "evolution" && qrcodeRaw) {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
          <DialogDescription>
            Conecte uma nova conta WhatsApp ao Lidzy de forma rápida e segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instance Name */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Instância</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: WhatsApp Vendas"
            />
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>Provedor</Label>
            <RadioGroup value={provider} onValueChange={(value) => setProvider(value as any)}>
              {/* Evolution API Option */}
              <Card className={provider === "evolution" ? "border-primary border-2" : ""}>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="evolution" id="evolution" />
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">Evolution API</CardTitle>
                          <CardDescription className="text-sm">
                            Servidor próprio já configurado - Pronto para usar
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Pronto
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Servidor próprio configurado
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Gratuito e ilimitado
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Múltiplas contas WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Conexão direta e segura
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Z-API Option */}
              <Card className={provider === "zapi" ? "border-primary border-2" : "opacity-75"}>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="zapi" id="zapi" />
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base">Z-API</CardTitle>
                          <CardDescription className="text-sm">
                            Serviço externo pago - Requer conta própria
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Opcional
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-muted-foreground" />
                      Serviço externo gerenciado
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-muted-foreground" />
                      Requer assinatura paga
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-muted-foreground" />
                      Suporte oficial do provedor
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Z-API Config Fields */}
          {provider === "zapi" && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-semibold">Configuração Z-API</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="zapi-instance">Instance ID</Label>
                  <Input
                    id="zapi-instance"
                    value={zapiInstanceId}
                    onChange={(e) => setZapiInstanceId(e.target.value)}
                    placeholder="Ex: 3BE5..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zapi-key">API Key (Token)</Label>
                  <Input
                    id="zapi-key"
                    type="password"
                    value={zapiApiKey}
                    onChange={(e) => setZapiApiKey(e.target.value)}
                    placeholder="Ex: E7D9..."
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Você encontra essas informações no painel da Z-API em{" "}
                  <a
                    href="https://api.z-api.io/instances"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    api.z-api.io/instances
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Evolution API Config - Servidor configurado automaticamente */}
          {provider === "evolution" && (
            <div className="space-y-3 rounded-lg border border-green-200 p-4 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-full bg-green-600 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Tudo Pronto! 🚀
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                    Sua instância será criada automaticamente no servidor Evolution API. Após criar, você receberá um QR Code para escanear com seu WhatsApp. É só isso!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
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
