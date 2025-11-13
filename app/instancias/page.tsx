"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertDialogCustom } from "@/components/alert-dialog-custom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Smartphone, AlertCircle, QrCode, RefreshCw, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { CreateInstanceDialog } from "@/components/create-instance-dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Instancia {
  id: string
  nome: string
  tipo: string
  instance_id: string
  token: string
  token_seguranca: string
  ativo: boolean
  created_at: string
}

export default function InstanciasPage() {
  const [instancias, setInstancias] = useState<Instancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Z-API",
    instance_id: "",
    token: "",
    token_seguranca: "",
  })

  const [qrCodeDialog, setQrCodeDialog] = useState<{
    open: boolean
    instanceName: string
    qrcode: string | null
    loading: boolean
  }>({
    open: false,
    instanceName: "",
    qrcode: null,
    loading: false,
  })

  const [dialogState, setDialogState] = useState<{
    open: boolean
    title: string
    message: string
    type: "success" | "error" | "warning" | "info"
    details?: string
  }>({
    open: false,
    title: "",
    message: "",
    type: "info",
  })

  const showDialog = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    details?: string,
  ) => {
    setDialogState({ open: true, title, message, type, details })
  }

  const closeDialog = () => {
    setDialogState({ ...dialogState, open: false })
  }

  useEffect(() => {
    loadInstancias()

    // Configurar Supabase Realtime para atualizar status automaticamente
    const supabase = createClient()

    const channel = supabase
      .channel('instancias-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'instancias'
        },
        (payload) => {
          console.log('[Realtime] Instance updated:', payload)

          // Atualizar a instância na lista
          setInstancias((prev) =>
            prev.map((inst) =>
              inst.id === payload.new.id
                ? { ...inst, ...payload.new }
                : inst
            )
          )

          // Mostrar toast quando conectar
          if (payload.new.ativo && !payload.old.ativo) {
            toast.success(`✅ ${payload.new.nome} conectado com sucesso!`)

            // Fechar o dialog de QR code se estiver aberto
            setQrCodeDialog((prev) => ({
              ...prev,
              open: false
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadInstancias = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/instancias")

      if (!response.ok) {
        throw new Error("Erro ao carregar instâncias")
      }

      const data = await response.json()
      setInstancias(data.instancias || [])
    } catch (err: any) {
      console.error("Erro ao carregar instâncias:", err)
      setError(err.message || "Erro ao carregar instâncias")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvolution = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/instancias/evolution/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: formData.nome }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar instância")
      }

      const data = await response.json()

      await loadInstancias()
      setShowForm(false)
      setFormData({
        nome: "",
        tipo: "Z-API",
        instance_id: "",
        token: "",
        token_seguranca: "",
      })

      // Mostrar QR code
      if (data.qrcode) {
        setQrCodeDialog({
          open: true,
          instanceName: formData.nome,
          qrcode: data.qrcode.base64 || data.qrcode.code,
          loading: false,
        })
      }

      showDialog("Sucesso", "Instância Evolution API criada! Escaneie o QR code para conectar.", "success")
    } catch (err: any) {
      console.error("Erro ao criar instância Evolution:", err)
      showDialog("Erro", err.message || "Erro ao criar instância Evolution", "error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.tipo === "Evolution API") {
      return handleCreateEvolution(e)
    }

    try {
      const url = editingId ? "/api/instancias" : "/api/instancias"
      const method = editingId ? "PATCH" : "POST"
      const body = editingId ? { ...formData, id: editingId } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar instância")
      }

      await loadInstancias()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        nome: "",
        tipo: "Z-API",
        instance_id: "",
        token: "",
        token_seguranca: "",
      })
      showDialog("Sucesso", "Instância salva com sucesso!", "success")
    } catch (err: any) {
      console.error("Erro ao salvar instância:", err)
      showDialog("Erro", err.message || "Erro ao salvar instância", "error")
    }
  }

  const handleGetQrCode = async (instanceName: string) => {
    setQrCodeDialog({
      open: true,
      instanceName,
      qrcode: null,
      loading: true,
    })

    try {
      const response = await fetch(`/api/instancias/evolution/qrcode?instanceName=${instanceName}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar QR code")
      }

      const data = await response.json()

      setQrCodeDialog({
        open: true,
        instanceName,
        qrcode: data.base64 || data.code,
        loading: false,
      })
    } catch (err: any) {
      console.error("Erro ao buscar QR code:", err)
      showDialog("Erro", err.message || "Erro ao buscar QR code", "error")
      setQrCodeDialog({ open: false, instanceName: "", qrcode: null, loading: false })
    }
  }

  const handleCheckStatus = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/instancias/evolution/status?instanceName=${instanceName}`)

      if (!response.ok) {
        throw new Error("Erro ao verificar status")
      }

      const data = await response.json()

      if (data.state === "open") {
        showDialog("Conectado", "WhatsApp conectado com sucesso!", "success")
        await loadInstancias()
      } else {
        showDialog("Desconectado", `Status: ${data.state}`, "warning")
      }
    } catch (err: any) {
      console.error("Erro ao verificar status:", err)
      showDialog("Erro", err.message || "Erro ao verificar status", "error")
    }
  }

  const handleEdit = (instancia: Instancia) => {
    setEditingId(instancia.id)
    setFormData({
      nome: instancia.nome,
      tipo: instancia.tipo,
      instance_id: instancia.instance_id,
      token: instancia.token,
      token_seguranca: instancia.token_seguranca,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, tipo: string, instanceName: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instância?")) return

    try {
      if (tipo === "Evolution API") {
        await fetch(`/api/instancias/evolution/delete?instanceName=${instanceName}`, {
          method: "DELETE",
        })
      } else {
        const response = await fetch(`/api/instancias?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Erro ao excluir instância")
        }
      }

      await loadInstancias()
      showDialog("Sucesso", "Instância excluída com sucesso!", "success")
    } catch (err: any) {
      console.error("Erro ao excluir instância:", err)
      showDialog("Erro", err.message || "Erro ao excluir instância", "error")
    }
  }

  const handleToggle = async (id: string, ativo: boolean) => {
    try {
      const response = await fetch("/api/instancias/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ativo }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar status")
      }

      await loadInstancias()
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err)
      showDialog("Erro", err.message || "Erro ao atualizar status", "error")
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-52">
        <Header title="Instâncias WhatsApp" />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-green-500/5 p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando instâncias...</p>
                </div>
              </div>
            ) : error ? (
              <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Erro ao carregar instâncias</h3>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
                    <Button onClick={loadInstancias} variant="outline" size="sm" className="mt-3 bg-transparent">
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Instâncias WhatsApp
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                      Gerencie suas conexões Z-API e Evolution API
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nova Instância</span>
                  </Button>
                </div>

                {showForm && (
                  <Card className="p-4 md:p-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                    <h2 className="text-lg md:text-xl font-semibold mb-4">
                      {editingId ? "Editar Instância" : "Nova Instância"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome da Instância *</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: WhatsApp Principal"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo *</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                            disabled={!!editingId}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Z-API">Z-API</SelectItem>
                              {/* <SelectItem value="Evolution API">Evolution API</SelectItem> */}
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.tipo === "Z-API" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="instance_id">Instance ID *</Label>
                              <Input
                                id="instance_id"
                                value={formData.instance_id}
                                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                                placeholder="Ex: 3C12345678"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="token">Token *</Label>
                              <Input
                                id="token"
                                value={formData.token}
                                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                placeholder="Token da API"
                                required
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="token_seguranca">Token de Segurança *</Label>
                              <Input
                                id="token_seguranca"
                                value={formData.token_seguranca}
                                onChange={(e) => setFormData({ ...formData, token_seguranca: e.target.value })}
                                placeholder="Token de segurança da API"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* {formData.tipo === "Evolution API" && (
                          <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              A instância Evolution API será criada automaticamente. Após criar, você receberá um QR
                              code para conectar seu WhatsApp.
                            </p>
                          </div>
                        )} */}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForm(false)
                            setEditingId(null)
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">{editingId ? "Salvar Alterações" : "Criar Instância"}</Button>
                      </div>
                    </form>
                  </Card>
                )}

                {instancias.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma instância configurada</h3>
                    <p className="text-muted-foreground mb-4">Conecte sua primeira instância para começar</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Instância
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instancias.map((instancia) => (
                      <Card
                        key={instancia.id}
                        className="p-4 md:p-6 hover:shadow-lg transition-all duration-200 border-primary/10 bg-gradient-to-br from-background to-primary/5"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Smartphone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm md:text-base">{instancia.nome}</h3>
                              <p className="text-xs text-muted-foreground">{instancia.tipo}</p>
                            </div>
                          </div>
                          <Switch
                            checked={instancia.ativo}
                            onCheckedChange={(checked) => handleToggle(instancia.id, checked)}
                          />
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Instance ID:</span>
                            <p className="font-mono text-xs truncate">{instancia.instance_id}</p>
                          </div>
                          {instancia.tipo === "Z-API" && (
                            <div>
                              <span className="text-muted-foreground">Token:</span>
                              <p className="font-mono text-xs truncate">{instancia.token.substring(0, 20)}...</p>
                            </div>
                          )}
                        </div>

                        {instancia.tipo === "Evolution API" ? (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGetQrCode(instancia.instance_id)}
                              className="w-full gap-2"
                            >
                              <QrCode className="h-3 w-3" />
                              Ver QR Code
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckStatus(instancia.instance_id)}
                              className="w-full gap-2"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Verificar Status
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(instancia.id, instancia.tipo, instancia.instance_id)}
                              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(instancia)}
                              className="flex-1 gap-2"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(instancia.id, instancia.tipo, instancia.instance_id)}
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Dialog open={qrCodeDialog.open} onOpenChange={(open) => setQrCodeDialog({ ...qrCodeDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR code abaixo com seu WhatsApp para conectar a instância {qrCodeDialog.instanceName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            {qrCodeDialog.loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando QR code...</p>
              </div>
            ) : qrCodeDialog.qrcode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src={qrCodeDialog.qrcode || "/placeholder.svg"}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">1. Abra o WhatsApp no seu celular</p>
                  <p className="text-sm text-muted-foreground">
                    2. Toque em Menu ou Configurações e selecione Aparelhos conectados
                  </p>
                  <p className="text-sm text-muted-foreground">3. Toque em Conectar um aparelho</p>
                  <p className="text-sm text-muted-foreground">
                    4. Aponte seu celular para esta tela para escanear o código
                  </p>
                </div>
                <Button
                  onClick={() => handleGetQrCode(qrCodeDialog.instanceName)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar QR Code
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Erro ao carregar QR code</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        open={dialogState.open}
        onClose={closeDialog}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        details={dialogState.details}
      />

      <CreateInstanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={(data) => {
          loadInstancias()
          setShowCreateDialog(false)

          // Se criou uma instância Evolution API, mostrar QR code automaticamente
          if (data?.qrcode && data?.instanceName) {
            setQrCodeDialog({
              open: true,
              instanceName: data.instanceName,
              qrcode: data.qrcode,
              loading: false,
            })
          }
        }}
      />
    </div>
  )
}
