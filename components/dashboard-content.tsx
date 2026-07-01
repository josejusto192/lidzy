"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  XCircle,
  Search,
  MoreHorizontal,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  Filter,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatabaseSetupAlert } from "@/components/database-setup-alert"
import { AlertDialogCustom } from "@/components/alert-dialog-custom"
import { STATUS_LABELS, STATUS_COLORS, type StatusContato } from "@/lib/status-config"
import { GeradorCasaDados } from "@/components/gerador-casa-dos-dados"
import { ExportMenu } from "@/components/export-menu"
import { NovoContatoManual } from "@/components/novo-contato-manual"

interface Lead {
  id: string
  empresa: string
  cnpj?: string
  telefone: string
  nicho: string
  status: string
  endereco?: string
  regiao?: string
  website?: string
  rating?: number
  tags?: Array<{ id: string; nome: string; cor: string }>
}

interface Agent {
  id: string
  nome: string
  ativo: boolean
  instancia_id?: string
}

interface Instance {
  id: string
  nome: string
  // other instance fields
}

interface Tag {
  id: string
  nome: string
  cor: string
}

export function DashboardContent() {
  const [nicho, setNicho] = useState("")
  const [regiao, setRegiao] = useState("")
  const [paginas, setPaginas] = useState(1)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [nichoFilter, setNichoFilter] = useState("todos")
  const [regiaoFilter, setRegiaoFilter] = useState("todos")
  const [tagFilter, setTagFilter] = useState("todos")
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [databaseNotSetup, setDatabaseNotSetup] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [isEditingLead, setIsEditingLead] = useState(false)
  const [editLeadForm, setEditLeadForm] = useState({
    empresa: "",
    telefone: "",
    nicho: "",
    regiao: "",
    website: "",
    endereco: "",
  })
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState<Lead | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
    details?: string
  }>({
    open: false,
    type: "info",
    title: "",
    message: "",
  })
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false)

  const [creditEstimate, setCreditEstimate] = useState(0)
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false)
  const [currentCredits, setCurrentCredits] = useState(0)
  const [generationResult, setGenerationResult] = useState<{
    leadsAdded: number
    creditsUsed: number
    duplicatesSkipped: number
  } | null>(null)

  const router = useRouter()

  useEffect(() => {
    loadLeads()
    loadAgents()
    loadCredits()
    loadTags()
  }, [statusFilter, nichoFilter, regiaoFilter, tagFilter])

  const loadTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setAllTags(data.tags || [])
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar tags:", err)
    }
  }

  const loadCredits = async () => {
    try {
      const response = await fetch("/api/creditos")
      if (response.ok) {
        const data = await response.json()
        setCurrentCredits(data.creditos || 0)
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar créditos:", err)
    }
  }

  const loadLeads = async () => {
    if (isLoadingLeads) return

    setIsLoadingLeads(true)
    setDatabaseNotSetup(false)
    setFetchError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "todos") params.append("status", statusFilter)
      if (nichoFilter !== "todos") params.append("nicho", nichoFilter)
      if (regiaoFilter !== "todos") params.append("regiao", regiaoFilter)
      // Add tagFilter to API request
      if (tagFilter !== "todos") params.append("tagId", tagFilter)

      const response = await fetch(`/api/contatos?${params.toString()}`)

      if (response.status === 503) {
        const data = await response.json()
        if (data.error === "DATABASE_NOT_SETUP") {
          setDatabaseNotSetup(true)
          setIsLoadingLeads(false)
          return
        }
      }

      if (!response.ok) {
        console.error("[v0] Erro ao carregar leads:", response.status)
        setFetchError(`Erro ao carregar leads: ${response.status}`)
        setIsLoadingLeads(false)
        return
      }

      const data = await response.json()

      const formattedLeads = data.contatos.map((contato: any) => ({
        id: contato.id,
        empresa: contato.nome_empresa,
        cnpj: contato.cnpj,
        telefone: contato.telefone || "Não disponível",
        nicho: contato.nicho,
        status: contato.status,
        endereco: contato.endereco,
        regiao: contato.regiao,
        website: contato.website,
        tags: contato.tags || [],
      }))
      setLeads(formattedLeads)
    } catch (err) {
      console.error("[v0] Erro ao carregar leads:", err)
      setFetchError(err instanceof Error ? err.message : "Erro de conexão ao carregar leads")
    } finally {
      setIsLoadingLeads(false)
    }
  }

  const loadAgents = async () => {
    try {
      const response = await fetch("/api/agentes")
      if (!response.ok) {
        console.error("[v0] Erro ao carregar agentes:", response.status)
        return
      }
      const data = await response.json()
      const activeAgents = data.agentes.filter((agent: Agent) => agent.ativo)
      setAgents(activeAgents)
    } catch (err) {
      console.error("[v0] Erro ao carregar agentes:", err)
    }
  }

  useEffect(() => {
    const estimate = paginas * 10
    setCreditEstimate(estimate)
  }, [paginas])

  const handleGerarLeads = async () => {
    if (!nicho || !regiao) {
      setError("Por favor, preencha nicho e regiao")
      return
    }

    // Mostrar diálogo de confirmação com estimativa
    setShowCreditConfirmation(true)
  }

  const confirmAndGenerateLeads = async () => {
    setShowCreditConfirmation(false)
    setLoading(true)
    setError("")
    setGenerationResult(null)

    try {
      const response = await fetch("/api/gerar-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nicho,
          regiao,
          paginas: paginas,
        }),
      })

      const data = await response.json()

      if (response.status === 503 && data.error === "DATABASE_NOT_SETUP") {
        setDatabaseNotSetup(true)
        setError("Banco de dados não configurado. Execute o script SQL primeiro.")
        setLoading(false)
        return
      }

      if (!response.ok) {
        if (data.error === "INSUFFICIENT_CREDITS") {
          setAlertDialog({
            open: true,
            type: "warning",
            title: "Créditos Insuficientes",
            message: data.message,
          })
        } else {
          throw new Error(data.error || "Erro ao gerar leads")
        }
        setLoading(false)
        return
      }

      setGenerationResult({
        leadsAdded: data.total || 0,
        creditsUsed: data.creditsUsed || 0,
        duplicatesSkipped: data.duplicatesSkipped || 0,
      })

      await loadLeads()
      await loadCredits()

      setAlertDialog({
        open: true,
        type: "success",
        title: "Contatos Gerados com Sucesso!",
        message: `${data.total} novos contatos adicionados. ${data.creditsUsed} créditos foram utilizados.${data.duplicatesSkipped > 0 ? ` ${data.duplicatesSkipped} duplicados foram ignorados.` : ""}`,
      })

      setNicho("")
      setRegiao("")
      setPaginas(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar leads")
      console.error("[v0] Erro:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedAgentId || !selectedLeadForMessage) {
      setAlertDialog({
        open: true,
        type: "warning",
        title: "Atenção",
        message: "Por favor, selecione um agente antes de enviar a mensagem.",
      })
      return
    }

    console.log("[v0] Iniciando envio de mensagem para:", {
      leadId: selectedLeadForMessage.id,
      leadEmpresa: selectedLeadForMessage.empresa,
      leadTelefone: selectedLeadForMessage.telefone,
      agentId: selectedAgentId,
    })

    setIsSendingMessage(true)

    try {
      const agentResponse = await fetch(`/api/agentes?id=${selectedAgentId}`)
      if (!agentResponse.ok) {
        throw new Error("Erro ao buscar dados do agente")
      }
      const agentData = await agentResponse.json()
      const fullAgent = agentData.agentes.find((a: any) => a.id === selectedAgentId)

      if (!fullAgent) {
        throw new Error("Agente não encontrado")
      }

      console.log("[v0] Agente encontrado:", { id: fullAgent.id, nome: fullAgent.nome })

      let instanceData = null
      if (fullAgent.instancia_id) {
        const instanceResponse = await fetch(`/api/instancias?id=${fullAgent.instancia_id}`)
        if (instanceResponse.ok) {
          const instanceResult = await instanceResponse.json()
          instanceData = instanceResult.instancias?.[0] || null
          console.log("[v0] Instância encontrada:", instanceData?.nome)
        }
      }

      console.log("[v0] Usando dados do lead selecionado:", {
        id: selectedLeadForMessage.id,
        empresa: selectedLeadForMessage.empresa,
        telefone: selectedLeadForMessage.telefone,
      })

      const webhookPayload = {
        agente: fullAgent,
        contato: {
          id: selectedLeadForMessage.id,
          nome_empresa: selectedLeadForMessage.empresa,
          telefone: selectedLeadForMessage.telefone,
          nicho: selectedLeadForMessage.nicho,
          status: selectedLeadForMessage.status,
          endereco: selectedLeadForMessage.endereco,
          regiao: selectedLeadForMessage.regiao,
          website: selectedLeadForMessage.website,
          tags: selectedLeadForMessage.tags,
        },
        instancia: instanceData,
      }

      console.log("[v0] Enviando para webhook:", webhookPayload)

      const response = await fetch("https://n8n.josejusto.com.br/webhook/unico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Erro na resposta do webhook:", errorText)
        throw new Error("Erro ao enviar mensagem")
      }

      const responseData = await response.json()
      console.log("[v0] Resposta do webhook:", responseData)

      setSendMessageModalOpen(false)
      setSelectedAgentId("")
      setSelectedLeadForMessage(null)

      setAlertDialog({
        open: true,
        type: "success",
        title: "Mensagem Adicionada à Fila",
        message: `A mensagem para ${selectedLeadForMessage.empresa} está sendo processada. Acompanhe o status na aba Conversas.`,
      })

      await loadLeads()
    } catch (err) {
      console.error("[v0] Erro ao enviar mensagem:", err)

      setSendMessageModalOpen(false)

      setAlertDialog({
        open: true,
        type: "error",
        title: "Erro",
        message: "Não foi possível enviar a mensagem. Tente novamente.",
        details: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleOpenConversation = async (lead: Lead) => {
    try {
      const response = await fetch("/api/conversas/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: lead.telefone,
          contato_id: lead.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao abrir conversa")
      }

      const { conversa } = await response.json()

      router.push(`/conversas?id=${conversa.id}`)
    } catch (error) {
      console.error("[v0] Error opening conversation:", error)
      setAlertDialog({
        open: true,
        type: "error",
        title: "Erro",
        message: "Não foi possível abrir a conversa. Tente novamente.",
      })
    }
  }

  const handleEditLead = async () => {
    if (!selectedLead) return

    try {
      const response = await fetch("/api/contatos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLead.id,
          nome_empresa: editLeadForm.empresa,
          telefone: editLeadForm.telefone,
          nicho: editLeadForm.nicho,
          regiao: editLeadForm.regiao,
          website: editLeadForm.website,
          endereco: editLeadForm.endereco,
        }),
      })

      if (response.ok) {
        setIsEditingLead(false)
        setDetailsModalOpen(false)
        await loadLeads()
        setAlertDialog({
          open: true,
          type: "success",
          title: "Sucesso",
          message: "Contato atualizado com sucesso!",
        })
      }
    } catch (error) {
      console.error("[v0] Error updating lead:", error)
      setAlertDialog({
        open: true,
        type: "error",
        title: "Erro",
        message: "Não foi possível atualizar o contato.",
      })
    }
  }

  const totalLeads = leads.length
  const pendentes = leads.filter((l) => l.status === "pendente").length
  const enviados = leads.filter((l) => l.status === "mensagem enviada").length
  const erros = leads.filter((l) => l.status === "erro").length

  const nichosUnicos = Array.from(new Set(leads.map((lead) => lead.nicho).filter(Boolean)))
  const regioesUnicas = Array.from(new Set(leads.map((lead) => lead.regiao).filter(Boolean)))

  const filteredLeadsCount = leads.filter((lead) => {
    const matchStatus = statusFilter === "todos" || lead.status === statusFilter
    const matchNicho = nichoFilter === "todos" || lead.nicho === nichoFilter
    const matchRegiao = regiaoFilter === "todos" || lead.regiao === regiaoFilter
    const matchTag = tagFilter === "todos" || lead.tags?.some((tag) => tag.id === tagFilter)
    return matchStatus && matchNicho && matchRegiao && matchTag
  }).length

  const filteredLeads = leads.filter((lead) => {
    const matchStatus = statusFilter === "todos" || lead.status === statusFilter
    const matchNicho = nichoFilter === "todos" || lead.nicho === nichoFilter
    const matchRegiao = regiaoFilter === "todos" || lead.regiao === regiaoFilter
    const matchTag = tagFilter === "todos" || lead.tags?.some((tag) => tag.id === tagFilter)
    return matchStatus && matchNicho && matchRegiao && matchTag
  })

  const closeAlertDialog = () => {
    setAlertDialog({
      open: false,
      type: "info",
      title: "",
      message: "",
    })
  }

  if (databaseNotSetup) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground">Gerencie e visualize seus contatos</p>
        </div>
        <DatabaseSetupAlert />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground">Gerencie e visualize seus contatos</p>
        </div>
        <Card className="bg-red-500/10 border-red-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-500/10 p-2">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-500 mb-2">Erro ao Carregar Dashboard</h3>
              <p className="text-sm text-red-500/80 mb-4">{fetchError}</p>
              <Button
                onClick={() => loadLeads()}
                variant="outline"
                className="border-red-500/20 text-red-500 hover:bg-red-500/10"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contatos</h1>
        <p className="text-sm text-muted-foreground">Gere e visualize seus contatos em tempo real</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        <Card className="bg-card p-4 md:p-6">
          <div className="mb-4 md:mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Gerador de Contatos</h2>
                <p className="text-xs text-muted-foreground">Busque novos contatos automaticamente</p>
              </div>
            </div>
            <NovoContatoManual onCreated={loadLeads} />
          </div>

          <Tabs defaultValue="google">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="google" className="flex-1 text-xs">
                Google Maps
              </TabsTrigger>
              <TabsTrigger value="casadados" className="flex-1 text-xs">
                Receita Federal (CNPJ)
              </TabsTrigger>
            </TabsList>

            {/* ── Aba Google Maps (método original) ── */}
            <TabsContent value="google" className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Nicho</label>
                <Input
                  placeholder="Ex: Restaurantes, Clínicas"
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Região</label>
                <Input
                  placeholder="Ex: São Paulo, Rio de Janeiro"
                  value={regiao}
                  onChange={(e) => setRegiao(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Páginas</label>
                <div className="rounded-lg bg-secondary p-4 space-y-2">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {paginas} {paginas === 1 ? "página" : "páginas"}
                    </span>
                    <span className="text-xs text-muted-foreground">até {paginas * 10} resultados</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={paginas}
                    onChange={(e) => setPaginas(Number.parseInt(e.target.value))}
                    disabled={loading}
                    className="w-full accent-blue-500 disabled:opacity-50"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimativa de créditos:</span>
                      <span className="font-semibold text-foreground">~{creditEstimate} créditos</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Seu saldo:</span>
                      <span className={currentCredits >= creditEstimate ? "text-green-500" : "text-red-500"}>
                        {currentCredits} créditos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
              )}

              {generationResult && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-green-500">Última Geração</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Contatos Adicionados</p>
                      <p className="text-lg font-bold text-green-500">{generationResult.leadsAdded}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Créditos Gastos</p>
                      <p className="text-lg font-bold text-green-500">{generationResult.creditsUsed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duplicados</p>
                      <p className="text-lg font-bold text-orange-500">{generationResult.duplicatesSkipped}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleGerarLeads} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Contatos
                  </>
                )}
              </Button>
            </TabsContent>

            {/* ── Aba Casa dos Dados ── */}
            <TabsContent value="casadados">
              <GeradorCasaDados
                currentCredits={currentCredits}
                existingCnpjs={leads.map((l) => (l.cnpj || "").replace(/\D/g, "")).filter(Boolean)}
                onLeadsGenerated={async () => {
                  await loadLeads()
                  await loadCredits()
                }}
                onAlert={({ type, title, message }) =>
                  setAlertDialog({ open: true, type, title, message })
                }
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Card className="bg-card p-4 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Contatos Gerados</h2>
              <p className="text-xs text-muted-foreground">
                {filteredLeadsCount} de {totalLeads} contatos
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar contatos..." className="w-full bg-secondary pl-10" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-2 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="mensagem enviada">Mensagem Enviada</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={nichoFilter} onValueChange={setNichoFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Nicho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Nichos</SelectItem>
                  {nichosUnicos.map((nicho) => (
                    <SelectItem key={nicho} value={nicho}>
                      {nicho}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={regiaoFilter} onValueChange={setRegiaoFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Regiões</SelectItem>
                  {regioesUnicas.map((regiao) => (
                    <SelectItem key={regiao} value={regiao!}>
                      {regiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Etiquetas</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                        {tag.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exportar */}
            <ExportMenu
              filters={{ status: statusFilter, nicho: nichoFilter, regiao: regiaoFilter }}
            />
          </div>
        </div>

        {isLoadingLeads ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 rounded-full bg-muted p-3 w-fit">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum contato gerado ainda. Use o gerador de contatos para começar.
            </p>
          </div>
        ) : (
          /* Removed overflow-x-auto wrapper and made table responsive with hidden columns on mobile */
          <div className="w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Empresa
                  </th>
                  <th className="pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Telefone
                  </th>
                  <th className="hidden md:table-cell pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nicho
                  </th>
                  <th className="hidden lg:table-cell pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Região
                  </th>
                  <th className="hidden xl:table-cell pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Website
                  </th>
                  <th className="hidden lg:table-cell pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Etiquetas
                  </th>
                  <th className="pb-3 px-2 md:px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="pb-3 px-2 md:px-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="py-3 md:py-4 px-2 md:px-4 text-sm font-medium text-foreground">
                      <div className="max-w-[150px] md:max-w-none truncate">{lead.empresa}</div>
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-4 text-sm text-muted-foreground">
                      <div className="max-w-[120px] md:max-w-none truncate">{lead.telefone}</div>
                    </td>
                    <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4 text-sm text-muted-foreground">
                      {lead.nicho}
                    </td>
                    <td className="hidden lg:table-cell py-3 md:py-4 px-2 md:px-4 text-sm text-muted-foreground">
                      {lead.regiao || "-"}
                    </td>
                    <td className="hidden xl:table-cell py-3 md:py-4 px-2 md:px-4 text-sm text-muted-foreground">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate block max-w-[150px]"
                        >
                          Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="hidden lg:table-cell py-3 md:py-4 px-2 md:px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {lead.tags && lead.tags.length > 0 ? (
                          lead.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} style={{ backgroundColor: tag.cor }} className="text-xs">
                              {tag.nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                        {lead.tags && lead.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{lead.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-4">
                      <Badge className={cn("text-xs whitespace-nowrap", STATUS_COLORS[lead.status as StatusContato])}>
                        {STATUS_LABELS[lead.status as StatusContato] || lead.status}
                      </Badge>
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/contatos/${lead.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver mais detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenConversation(lead)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Abrir Conversa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLeadForMessage(lead)
                              setSendMessageModalOpen(true)
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Enviar mensagem
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLead(lead)
                              setIsEditingLead(true)
                              setDetailsModalOpen(true)
                              setEditLeadForm({
                                empresa: lead.empresa,
                                telefone: lead.telefone,
                                nicho: lead.nicho,
                                regiao: lead.regiao || "",
                                website: lead.website || "",
                                endereco: lead.endereco || "",
                              })
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => alert("Funcionalidade em desenvolvimento")}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              {isEditingLead ? "Edite as informações do lead" : "Informações completas sobre o lead selecionado"}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.empresa}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, empresa: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground font-medium">{selectedLead.empresa}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.telefone}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, telefone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground">{selectedLead.telefone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nicho</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.nicho}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, nicho: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground">{selectedLead.nicho}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Região</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.regiao}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, regiao: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground">{selectedLead.regiao || "Não informado"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <span
                    className={`inline-flex rounded-full px-2 md:px-3 py-1 text-xs font-medium ${
                      selectedLead.status === "mensagem enviada"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : selectedLead.status === "erro"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                    }`}
                  >
                    {selectedLead.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.website}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, website: e.target.value })}
                    />
                  ) : selectedLead.website ? (
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline block truncate"
                    >
                      {selectedLead.website}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não informado</p>
                  )}
                </div>
              </div>

              {selectedLead.endereco && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  {isEditingLead ? (
                    <Input
                      value={editLeadForm.endereco}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, endereco: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground">{selectedLead.endereco}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {isEditingLead ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingLead(false)
                        setEditLeadForm({
                          empresa: selectedLead.empresa,
                          telefone: selectedLead.telefone,
                          nicho: selectedLead.nicho,
                          regiao: selectedLead.regiao || "",
                          website: selectedLead.website || "",
                          endereco: selectedLead.endereco || "",
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleEditLead}>Salvar Alterações</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingLead(true)
                        setSelectedLead(selectedLead)
                        setEditLeadForm({
                          empresa: selectedLead.empresa,
                          telefone: selectedLead.telefone,
                          nicho: selectedLead.nicho,
                          regiao: selectedLead.regiao || "",
                          website: selectedLead.website || "",
                          endereco: selectedLead.endereco || "",
                        })
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Lead
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sendMessageModalOpen} onOpenChange={setSendMessageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>Selecione um agente para enviar a mensagem</DialogDescription>
          </DialogHeader>

          {selectedLeadForMessage && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{selectedLeadForMessage.empresa}</p>
                <p className="text-xs text-muted-foreground">{selectedLeadForMessage.telefone}</p>
                <p className="text-xs text-muted-foreground">{selectedLeadForMessage.nicho}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Selecione o Agente</label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um agente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum agente ativo disponível
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSendMessageModalOpen(false)} disabled={isSendingMessage}>
                  Cancelar
                </Button>
                <Button onClick={handleSendMessage} disabled={isSendingMessage || !selectedAgentId}>
                  {isSendingMessage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreditConfirmation} onOpenChange={setShowCreditConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Geração de Contatos</DialogTitle>
            <DialogDescription>Revise os detalhes antes de continuar</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nicho:</span>
                <span className="font-medium text-foreground">{nicho}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Região:</span>
                <span className="font-medium text-foreground">{regiao}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Páginas:</span>
                <span className="font-medium text-foreground">{paginas}</span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimativa de créditos:</span>
                <span className="text-lg font-bold text-blue-500">~{creditEstimate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Seu saldo atual:</span>
                <span
                  className={`text-lg font-bold ${currentCredits >= creditEstimate ? "text-green-500" : "text-red-500"}`}
                >
                  {currentCredits}
                </span>
              </div>
              {currentCredits < creditEstimate && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Saldo insuficiente. Você precisa de mais créditos para continuar.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              * A quantidade final de créditos utilizados pode variar dependendo do número real de contatos encontrados
              e adicionados.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreditConfirmation(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmAndGenerateLeads}
                disabled={currentCredits < creditEstimate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirmar e Gerar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        open={alertDialog.open}
        onClose={closeAlertDialog}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        details={alertDialog.details}
        actionLabel={alertDialog.title === "Créditos Insuficientes" ? "Solicitar créditos" : undefined}
        onAction={alertDialog.title === "Créditos Insuficientes" ? () => window.open("https://wa.me/5515991485349", "_blank") : undefined}
      />
    </div>
  )
}
