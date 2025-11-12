"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Mail, MapPin, Calendar, DollarSign, Eye, Building2, Edit, MessageSquare } from "lucide-react"
import { STATUS_ORDER, STATUS_LABELS, STATUS_COLORS, type StatusContato } from "@/lib/status-config"
import { cn } from "@/lib/utils"

interface Contato {
  id: string
  nome_empresa: string
  telefone: string
  email?: string
  endereco?: string
  regiao?: string
  nicho?: string
  website?: string
  status: StatusContato
  valor?: number
  criado_em: string
}

export default function KanbanPage() {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedContact, setDraggedContact] = useState<Contato | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contato | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    nome_empresa: "",
    telefone: "",
    email: "",
    endereco: "",
    regiao: "",
    nicho: "",
    website: "",
    valor: "",
  })

  useEffect(() => {
    fetchContatos()
  }, [])

  const fetchContatos = async () => {
    try {
      console.log("[v0] Fetching contacts from database...")
      const response = await fetch("/api/contatos")
      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error fetching contacts:", data.error)
        return
      }

      console.log("[v0] Contacts fetched successfully:", data.contatos?.length || 0)
      setContatos(data.contatos || [])
    } catch (error) {
      console.error("[v0] Error fetching contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenContact = (contato: Contato) => {
    setSelectedContact(contato)
    setEditForm({
      nome_empresa: contato.nome_empresa || "",
      telefone: contato.telefone || "",
      email: contato.email || "",
      endereco: contato.endereco || "",
      regiao: contato.regiao || "",
      nicho: contato.nicho || "",
      website: contato.website || "",
      valor: contato.valor?.toString() || "0",
    })
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  const handleSaveValor = async () => {
    if (!selectedContact) return

    const valorNumber = Number.parseFloat(editForm.valor) || 0

    try {
      const response = await fetch("/api/contatos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedContact.id,
          valor: valorNumber,
        }),
      })

      if (response.ok) {
        setContatos((prev) => prev.map((c) => (c.id === selectedContact.id ? { ...c, valor: valorNumber } : c)))
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Error updating valor:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, contato: Contato) => {
    console.log("[v0] Drag started for contact:", contato.nome_empresa, "Status:", contato.status)
    setDraggedContact(contato)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, newStatus: StatusContato) => {
    e.preventDefault()
    console.log("[v0] Drop event triggered. New status:", newStatus)

    if (!draggedContact) {
      console.log("[v0] No dragged contact found")
      setDraggedContact(null)
      return
    }

    if (draggedContact.status === newStatus) {
      console.log("[v0] Status unchanged, skipping update")
      setDraggedContact(null)
      return
    }

    console.log("[v0] Updating contact status from", draggedContact.status, "to", newStatus)

    const previousStatus = draggedContact.status
    setContatos((prev) => prev.map((c) => (c.id === draggedContact.id ? { ...c, status: newStatus } : c)))

    try {
      console.log("[v0] Calling API to update status...")
      const response = await fetch("/api/contatos/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contatoId: draggedContact.id,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] API call failed with status:", response.status, result)
        setContatos((prev) => prev.map((c) => (c.id === draggedContact.id ? { ...c, status: previousStatus } : c)))
        alert(`Erro ao atualizar status: ${result.error || "Erro desconhecido"}`)
      } else {
        console.log("[v0] Status updated successfully:", result)
        await fetchContatos()
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      setContatos((prev) => prev.map((c) => (c.id === draggedContact.id ? { ...c, status: previousStatus } : c)))
      alert("Erro ao atualizar status. Tente novamente.")
    }

    setDraggedContact(null)
  }

  const handleSaveContact = async () => {
    if (!selectedContact) return

    const valorNumber = Number.parseFloat(editForm.valor) || 0

    try {
      const response = await fetch("/api/contatos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedContact.id,
          nome_empresa: editForm.nome_empresa,
          telefone: editForm.telefone,
          email: editForm.email,
          endereco: editForm.endereco,
          regiao: editForm.regiao,
          nicho: editForm.nicho,
          website: editForm.website,
          valor: valorNumber,
        }),
      })

      if (response.ok) {
        const { contato } = await response.json()
        setContatos((prev) => prev.map((c) => (c.id === selectedContact.id ? contato : c)))
        setIsEditMode(false)
        setIsModalOpen(false)
        fetchContatos()
      }
    } catch (error) {
      console.error("Error updating contact:", error)
    }
  }

  const getContatosByStatus = (status: StatusContato) => {
    return contatos.filter((c) => c.status === status)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Data não disponível"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Data inválida"
      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Data inválida"
    }
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (!value || value === 0) return null
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-52">
          <Header />
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="text-lg">Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-52">
        <Header />
        <main className="flex-1 bg-background" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="border-b bg-card px-6 py-4">
            <h1 className="text-2xl font-bold">Funil de Prospecção</h1>
            <p className="text-sm text-muted-foreground">{contatos.length} contatos no total</p>
          </div>

          <div className="h-[calc(100vh-9rem)] overflow-x-auto overflow-y-hidden p-6">
            <div className="flex h-full gap-4" style={{ minWidth: "max-content" }}>
              {STATUS_ORDER.map((status) => {
                const statusContatos = getContatosByStatus(status)
                const colorClass = STATUS_COLORS[status]

                return (
                  <div
                    key={status}
                    className="flex w-80 flex-col rounded-lg border bg-card"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <div className="flex items-center justify-between border-b p-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", colorClass)} />
                        <h3 className="font-semibold">{STATUS_LABELS[status]}</h3>
                      </div>
                      <Badge variant="secondary">{statusContatos.length}</Badge>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {statusContatos.map((contato) => (
                        <Card
                          key={contato.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, contato)}
                          className="cursor-move transition-all hover:shadow-md"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{contato.nome_empresa || "Sem nome"}</CardTitle>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      const response = await fetch("/api/conversas/find-or-create", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          phone: contato.telefone,
                                          contato_id: contato.id,
                                        }),
                                      })

                                      if (!response.ok) {
                                        throw new Error("Erro ao abrir conversa")
                                      }

                                      const { conversa } = await response.json()
                                      window.location.href = `/conversas?id=${conversa.id}`
                                    } catch (error) {
                                      console.error("[v0] Error opening conversation:", error)
                                      alert("Não foi possível abrir a conversa. Tente novamente.")
                                    }
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenContact(contato)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="text-xs">{contato.telefone}</span>
                            </div>
                            {contato.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate text-xs">{contato.email}</span>
                              </div>
                            )}
                            {contato.endereco && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs">
                                  {contato.endereco}
                                  {contato.regiao && ` - ${contato.regiao}`}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-xs">{formatDate(contato.criado_em)}</span>
                            </div>
                            {formatCurrency(contato.valor) && (
                              <div className="flex items-center gap-2 font-semibold text-green-600">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-xs">{formatCurrency(contato.valor)}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {statusContatos.length === 0 && (
                        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                          Nenhum contato
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contato</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Edite as informações do contato" : "Informações completas do contato"}
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.nome_empresa}
                      onChange={(e) => setEditForm({ ...editForm, nome_empresa: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{selectedContact.nome_empresa || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={cn("w-fit", STATUS_COLORS[selectedContact.status])}>
                    {STATUS_LABELS[selectedContact.status]}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.telefone}
                      onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{selectedContact.telefone}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="truncate">{selectedContact.email || "Não informado"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Endereço</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.endereco}
                      onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{selectedContact.endereco || "Não informado"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Região</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.regiao}
                      onChange={(e) => setEditForm({ ...editForm, regiao: e.target.value })}
                    />
                  ) : (
                    <p>{selectedContact.regiao || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nicho</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.nicho}
                      onChange={(e) => setEditForm({ ...editForm, nicho: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p>{selectedContact.nicho || "Não informado"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  {isEditMode ? (
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    />
                  ) : (
                    <p className="truncate text-sm">{selectedContact.website || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDate(selectedContact.criado_em)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Valor do Projeto (R$)</Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.valor}
                      onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-green-600">{formatCurrency(selectedContact.valor) || "R$ 0,00"}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                {isEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveContact}>Salvar Alterações</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button onClick={() => setIsEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Contato
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
