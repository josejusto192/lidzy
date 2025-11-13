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
  onSuccess?: () => void
}

export function CreateInstanceDialog({ open, onOpenChange, onSuccess }: CreateInstanceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<"zapi" | "baileys">("baileys")
  const [nome, setNome] = useState("")

  // Z-API config
  const [zapiInstanceId, setZapiInstanceId] = useState("")
  const [zapiApiKey, setZapiApiKey] = useState("")

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
      const config = provider === "zapi" ? {
        instanceId: zapiInstanceId,
        apiKey: zapiApiKey,
      } : {}

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
        onSuccess()
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
            Escolha o provedor e configure sua instância de WhatsApp
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
              {/* Baileys Option */}
              <Card className={provider === "baileys" ? "border-primary" : ""}>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="baileys" id="baileys" />
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">Baileys (Auto-hospedado)</CardTitle>
                          <CardDescription className="text-sm">
                            Conexão direta, gratuito mas requer servidor
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      Recomendado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Gratuito (sem custos mensais)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Controle total da infraestrutura
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Sem limitações de API
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Privacidade total dos dados
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Z-API Option */}
              <Card className={provider === "zapi" ? "border-primary" : ""}>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="zapi" id="zapi" />
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">Z-API (Externo)</CardTitle>
                          <CardDescription className="text-sm">
                            Serviço pago, estável e com suporte oficial
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Pago</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-blue-600" />
                      Conexão estável e confiável
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-blue-600" />
                      Suporte oficial 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-blue-600" />
                      Não requer infraestrutura própria
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-blue-600" />
                      Alta disponibilidade
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

          {/* Baileys Info */}
          {provider === "baileys" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950">
              <p className="text-blue-900 dark:text-blue-100">
                ℹ️ <strong>Baileys requer servidor próprio.</strong> Certifique-se de que o serviço Baileys está
                rodando em <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">localhost:3001</code>{" "}
                ou configure a URL no arquivo .env
              </p>
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
