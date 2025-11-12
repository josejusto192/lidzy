"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AlertDialogCustom } from "@/components/alert-dialog-custom"
import { Bot, Plus, Edit, Trash2, Loader2, Save, X, Play, Clock, Target, Zap } from "lucide-react"
import { useState, useEffect } from "react"

interface Agent {
  id: string
  nome: string
  descricao_persona: string
  produto_servico: string
  tom_voz: string
  objetivo: string
  informacoes_adicionais: string
  ativo: boolean
  horario_inicio?: string
  limite_mensagens?: number
  nichos?: string[]
  status?: string[]
  regiao?: string[]
  instancia_id?: string // Added instancia_id field
}

interface Instance {
  id: string
  nome: string
  tipo: string
  ativo: boolean
}

const NICHOS_DISPONIVEIS = [
  "Restaurantes",
  "Clínicas",
  "Academias",
  "Salões de Beleza",
  "Lojas de Roupas",
  "Supermercados",
  "Farmácias",
  "Padarias",
  "Pet Shops",
  "Autopeças",
  "Imobiliárias",
  "Escritórios de Advocacia",
  "Consultórios Médicos",
  "Escolas",
  "Hotéis",
]

const STATUS_DISPONIVEIS = [
  "pendente",
  "mensagem enviada",
  "erro",
  "Novo",
  "Contatado",
  "Interessado",
  "Não Interessado",
]

const HORARIOS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0")
  return `${hour}:00`
})

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [instances, setInstances] = useState<Instance[]>([]) // Added instances state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [nichosDisponiveis, setNichosDisponiveis] = useState<string[]>([])
  const [statusDisponiveis, setStatusDisponiveis] = useState<string[]>([])
  const [regioesDisponiveis, setRegioesDisponiveis] = useState<string[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  const [leadCount, setLeadCount] = useState<number | null>(null)
  const [countingLeads, setCountingLeads] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    descricao_persona: "",
    produto_servico: "",
    tom_voz: "profissional",
    objetivo: "",
    informacoes_adicionais: "",
    horario_inicio: "09:00",
    limite_mensagens: 50,
    nichos: [] as string[],
    status: [] as string[],
    regiao: [] as string[],
    instancia_id: "", // Added instancia_id to form data
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
    loadAgents()
    loadFilters() // Load all filters from database
    loadInstances()
  }, [])

  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/agentes")
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agentes || [])
      } else if (response.status === 404) {
        setError("A tabela de agentes ainda não foi criada. Execute o script SQL para criar a tabela.")
      } else {
        setError("Erro ao carregar agentes. Tente novamente.")
      }
    } catch (error) {
      console.error("[v0] Error loading agents:", error)
      setError("Erro ao conectar com o servidor. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  const loadRegioes = async () => {
    try {
      const response = await fetch("/api/contatos")
      if (response.ok) {
        const data = await response.json()
        const regioes = Array.from(new Set(data.contatos.map((c: any) => c.regiao).filter(Boolean))) as string[]
        setRegioesDisponiveis(regioes)
      }
    } catch (error) {
      console.error("[v0] Error loading regioes:", error)
    }
  }

  const loadInstances = async () => {
    try {
      const response = await fetch("/api/instancias")
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instancias || [])
      }
    } catch (error) {
      console.error("[v0] Error loading instances:", error)
    }
  }

  const loadFilters = async () => {
    setLoadingFilters(true)
    try {
      const response = await fetch("/api/agentes/filters")
      if (response.ok) {
        const data = await response.json()
        setNichosDisponiveis(data.nichos || [])
        setStatusDisponiveis(data.status || [])
        setRegioesDisponiveis(data.regioes || [])
        console.log("[v0] Filters loaded:", data)
      }
    } catch (error) {
      console.error("[v0] Error loading filters:", error)
    } finally {
      setLoadingFilters(false)
    }
  }

  const handleSave = async () => {
    if (!formData.nome || !formData.produto_servico || !formData.tom_voz) {
      showDialog("Campos obrigatórios", "Por favor, preencha os campos obrigatórios", "warning")
      return
    }

    setSaving(true)
    try {
      const url = "/api/agentes"
      const method = editingId ? "PATCH" : "POST"
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await loadAgents()
        resetForm()
        setShowForm(false)
      } else {
        showDialog("Erro", "Erro ao salvar agente", "error")
      }
    } catch (error) {
      console.error("[v0] Error saving agent:", error)
      showDialog("Erro", "Erro ao salvar agente", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (agent: Agent) => {
    setEditingId(agent.id)
    setFormData({
      nome: agent.nome,
      descricao_persona: agent.descricao_persona || "",
      produto_servico: agent.produto_servico,
      tom_voz: agent.tom_voz,
      objetivo: agent.objetivo || "",
      informacoes_adicionais: agent.informacoes_adicionais || "",
      horario_inicio: agent.horario_inicio || "09:00",
      limite_mensagens: agent.limite_mensagens || 50,
      nichos: agent.nichos || [],
      status: agent.status || [],
      regiao: agent.regiao || [],
      instancia_id: agent.instancia_id || "", // Include instancia_id in edit
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return

    try {
      const response = await fetch("/api/agentes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await loadAgents()
      } else {
        showDialog("Erro", "Erro ao excluir agente", "error")
      }
    } catch (error) {
      console.error("[v0] Error deleting agent:", error)
      showDialog("Erro", "Erro ao excluir agente", "error")
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/agentes/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ativo: !currentStatus }),
      })

      if (response.ok) {
        await loadAgents()
      } else {
        const data = await response.json()
        showDialog("Erro", data.error || "Erro ao atualizar status do agente", "error")
      }
    } catch (error) {
      console.error("[v0] Error toggling agent status:", error)
      showDialog("Erro", "Erro ao atualizar status do agente", "error")
    }
  }

  const handleTestAgent = async (agentId: string) => {
    setTesting(agentId)
    try {
      const response = await fetch("/api/agentes/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (Array.isArray(data.webhookResponse) && data.webhookResponse.length > 0) {
          const totalLeads = data.webhookResponse.length
          const successfulLeads = data.webhookResponse.filter(
            (lead: any) => lead.status === "Mensagem Enviada" || lead.status === "contato_inicial",
          ).length
          const failedLeads = totalLeads - successfulLeads

          showDialog(
            "Prospecção Concluída",
            `${successfulLeads} ${successfulLeads === 1 ? "mensagem enviada" : "mensagens enviadas"} com sucesso!`,
            "success",
            failedLeads > 0
              ? `${failedLeads} ${failedLeads === 1 ? "mensagem falhou" : "mensagens falharam"}. Verifique os detalhes dos leads.`
              : `Todas as mensagens foram enviadas aos leads selecionados.`,
          )
        } else {
          showDialog("Prospecção Concluída", "Prospecção concluída com sucesso!", "success")
        }
      } else {
        if (data.errorType === "no-leads") {
          showDialog(
            "Nenhum Lead Disponível",
            "Não há leads disponíveis com os filtros selecionados.",
            "warning",
            `${data.details}\n\nPara resolver:\n1. Ajuste os filtros do agente (nichos, status, região)\n2. Adicione novos leads ao sistema\n3. Verifique se os leads existentes correspondem aos filtros selecionados`,
          )
        } else if (data.errorType === "z-api-auth") {
          showDialog(
            "Credenciais Z-API inválidas",
            `Instância: ${data.instanceName || "Não identificada"}\n\n${data.error}`,
            "error",
            `${data.details}\n\nPara corrigir:\n1. Vá para a página de Instâncias\n2. Edite a instância "${data.instanceName || "associada"}"\n3. Verifique e atualize as credenciais (Token, Token de Segurança, Instance ID)\n4. Teste novamente`,
          )
        } else {
          showDialog("Erro ao iniciar prospecção", data.error, "error", data.details || "")
        }
      }
    } catch (error) {
      console.error("[v0] Error testing agent:", error)
      showDialog(
        "Erro de conexão",
        "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
        "error",
      )
    } finally {
      setTesting(null)
    }
  }

  const countLeads = async (nichos: string[], status: string[], regiao: string[]) => {
    // Only count if at least one filter is selected
    if (nichos.length === 0 && status.length === 0 && regiao.length === 0) {
      setLeadCount(null)
      return
    }

    setCountingLeads(true)
    try {
      const response = await fetch("/api/agentes/count-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nichos, status, regiao }),
      })

      if (response.ok) {
        const data = await response.json()
        setLeadCount(data.count)
        console.log("[v0] Lead count:", data.count)
      } else {
        console.error("[v0] Error counting leads")
        setLeadCount(null)
      }
    } catch (error) {
      console.error("[v0] Error counting leads:", error)
      setLeadCount(null)
    } finally {
      setCountingLeads(false)
    }
  }

  useEffect(() => {
    if (showForm) {
      countLeads(formData.nichos, formData.status, formData.regiao)
    }
  }, [formData.nichos, formData.status, formData.regiao, showForm])

  const toggleNicho = (nicho: string) => {
    setFormData((prev) => ({
      ...prev,
      nichos: prev.nichos.includes(nicho) ? prev.nichos.filter((n) => n !== nicho) : [...prev.nichos, nicho],
    }))
  }

  const toggleStatus = (statusItem: string) => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status.includes(statusItem)
        ? prev.status.filter((s) => s !== statusItem)
        : [...prev.status, statusItem],
    }))
  }

  const toggleRegiao = (regiaoItem: string) => {
    setFormData((prev) => ({
      ...prev,
      regiao: prev.regiao.includes(regiaoItem)
        ? prev.regiao.filter((r) => r !== regiaoItem)
        : [...prev.regiao, regiaoItem],
    }))
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      nome: "",
      descricao_persona: "",
      produto_servico: "",
      tom_voz: "profissional",
      objetivo: "",
      informacoes_adicionais: "",
      horario_inicio: "09:00",
      limite_mensagens: 50,
      nichos: [],
      status: [],
      regiao: [],
      instancia_id: "", // Reset instancia_id
    })
    setLeadCount(null)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-52">
        <Header title="Agentes de Prospecção" />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-blue-500/5 p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agentes de Prospecção</h1>
                <p className="text-sm text-muted-foreground">Gerencie seus agentes de primeira abordagem aos leads</p>
              </div>
              {!showForm && !error && (
                <Button
                  onClick={() => {
                    resetForm()
                    setShowForm(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agente
                </Button>
              )}
            </div>

            {error && (
              <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm p-8 text-center">
                <div className="mx-auto mb-4 rounded-full bg-red-500/10 p-4 w-fit">
                  <Bot className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Erro ao Carregar Agentes</h3>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                {error.includes("script SQL") && (
                  <div className="mt-4 rounded-lg bg-card/50 p-4 text-left">
                    <p className="text-sm font-medium text-foreground mb-2">Para resolver:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Execute o script SQL{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">004_create_agentes_prospeccao.sql</code>
                      </li>
                      <li>
                        Execute o script SQL{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">005_update_agentes_prospeccao.sql</code>
                      </li>
                      <li>Aguarde a criação da tabela no banco de dados</li>
                      <li>Recarregue esta página</li>
                    </ol>
                  </div>
                )}
                <Button onClick={loadAgents} className="mt-6 bg-transparent" variant="outline">
                  Tentar Novamente
                </Button>
              </Card>
            )}

            {/* Form Card */}
            {showForm && !error && (
              <Card className="border-blue-500/20 bg-card/80 backdrop-blur-sm p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Bot className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">
                        {editingId ? "Editar Agente" : "Novo Agente"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Configure a personalidade e comportamento do agente
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">
                        Nome do Agente <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nome"
                        placeholder="Ex: Agente Vendas"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="bg-secondary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tom_voz">
                        Tom de Voz <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.tom_voz}
                        onValueChange={(value) => setFormData({ ...formData, tom_voz: value })}
                      >
                        <SelectTrigger id="tom_voz" className="bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="amigavel">Amigável</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="entusiasmado">Entusiasmado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instancia_id">
                      Instância WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.instancia_id}
                      onValueChange={(value) => setFormData({ ...formData, instancia_id: value })}
                    >
                      <SelectTrigger id="instancia_id" className="bg-secondary">
                        <SelectValue placeholder="Selecione uma instância" />
                      </SelectTrigger>
                      <SelectContent>
                        {instances
                          .filter((i) => i.ativo)
                          .map((instance) => (
                            <SelectItem key={instance.id} value={instance.id}>
                              {instance.nome} ({instance.tipo})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {instances.filter((i) => i.ativo).length === 0 && (
                      <p className="text-xs text-yellow-500">
                        Nenhuma instância ativa disponível. Crie e ative uma instância primeiro.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-foreground">Configurações de Automação</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="horario_inicio" className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Horário de Início
                        </Label>
                        <Select
                          value={formData.horario_inicio}
                          onValueChange={(value) => setFormData({ ...formData, horario_inicio: value })}
                        >
                          <SelectTrigger id="horario_inicio" className="bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {HORARIOS.map((horario) => (
                              <SelectItem key={horario} value={horario}>
                                {horario}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="limite_mensagens" className="flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          Limite de Mensagens
                        </Label>
                        <Input
                          id="limite_mensagens"
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="Ex: 50"
                          value={formData.limite_mensagens}
                          onChange={(e) =>
                            setFormData({ ...formData, limite_mensagens: Number.parseInt(e.target.value) || 50 })
                          }
                          className="bg-secondary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Nichos para Prospectar</Label>
                      {loadingFilters ? (
                        <p className="text-xs text-muted-foreground">Carregando nichos...</p>
                      ) : nichosDisponiveis.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {nichosDisponiveis.map((nicho) => (
                              <Badge
                                key={nicho}
                                variant={formData.nichos.includes(nicho) ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  formData.nichos.includes(nicho)
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "hover:bg-blue-500/10"
                                }`}
                                onClick={() => toggleNicho(nicho)}
                              >
                                {nicho}
                              </Badge>
                            ))}
                          </div>
                          {formData.nichos.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.nichos.length}{" "}
                              {formData.nichos.length === 1 ? "nicho selecionado" : "nichos selecionados"}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Nenhum nicho disponível. Adicione leads com nichos primeiro.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status dos Leads</Label>
                      {loadingFilters ? (
                        <p className="text-xs text-muted-foreground">Carregando status...</p>
                      ) : statusDisponiveis.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {statusDisponiveis.map((statusItem) => (
                              <Badge
                                key={statusItem}
                                variant={formData.status.includes(statusItem) ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  formData.status.includes(statusItem)
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "hover:bg-green-500/10"
                                }`}
                                onClick={() => toggleStatus(statusItem)}
                              >
                                {statusItem}
                              </Badge>
                            ))}
                          </div>
                          {formData.status.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.status.length}{" "}
                              {formData.status.length === 1 ? "status selecionado" : "status selecionados"}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Nenhum status disponível. Adicione leads com status primeiro.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Regiões para Prospectar</Label>
                      {loadingFilters ? (
                        <p className="text-xs text-muted-foreground">Carregando regiões...</p>
                      ) : regioesDisponiveis.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {regioesDisponiveis.map((regiaoItem) => (
                              <Badge
                                key={regiaoItem}
                                variant={formData.regiao.includes(regiaoItem) ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  formData.regiao.includes(regiaoItem)
                                    ? "bg-purple-500 hover:bg-purple-600"
                                    : "hover:bg-purple-500/10"
                                }`}
                                onClick={() => toggleRegiao(regiaoItem)}
                              >
                                {regiaoItem}
                              </Badge>
                            ))}
                          </div>
                          {formData.regiao.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.regiao.length}{" "}
                              {formData.regiao.length === 1 ? "região selecionada" : "regiões selecionadas"}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma região disponível. Adicione leads com regiões primeiro.
                        </p>
                      )}
                    </div>

                    {(formData.nichos.length > 0 || formData.status.length > 0 || formData.regiao.length > 0) && (
                      <div
                        className={`rounded-lg p-4 ${
                          leadCount === 0
                            ? "bg-yellow-500/10 border border-yellow-500/20"
                            : "bg-blue-500/10 border border-blue-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target className={`h-4 w-4 ${leadCount === 0 ? "text-yellow-500" : "text-blue-500"}`} />
                          <div className="flex-1">
                            {countingLeads ? (
                              <p className="text-sm text-muted-foreground">Contando leads...</p>
                            ) : leadCount !== null ? (
                              <>
                                <p
                                  className={`text-sm font-semibold ${leadCount === 0 ? "text-yellow-500" : "text-blue-500"}`}
                                >
                                  {leadCount} {leadCount === 1 ? "lead encontrado" : "leads encontrados"}
                                </p>
                                {leadCount === 0 ? (
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                    ⚠️ Nenhum lead corresponde aos filtros selecionados. Ajuste os filtros para encontrar
                                    leads.
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Este agente irá prospectar {leadCount} {leadCount === 1 ? "lead" : "leads"} com as
                                    configurações atuais.
                                  </p>
                                )}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="produto_servico">
                      Produto/Serviço <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="produto_servico"
                      placeholder="Descreva o produto ou serviço que o agente irá oferecer..."
                      value={formData.produto_servico}
                      onChange={(e) => setFormData({ ...formData, produto_servico: e.target.value })}
                      className="bg-secondary min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao_persona">Descrição da Persona</Label>
                    <Textarea
                      id="descricao_persona"
                      placeholder="Descreva a personalidade do agente, como ele deve se comportar..."
                      value={formData.descricao_persona}
                      onChange={(e) => setFormData({ ...formData, descricao_persona: e.target.value })}
                      className="bg-secondary min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objetivo">Objetivo da Abordagem</Label>
                    <Textarea
                      id="objetivo"
                      placeholder="Qual o objetivo principal da primeira abordagem? Ex: Agendar reunião, apresentar produto..."
                      value={formData.objetivo}
                      onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                      className="bg-secondary min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="informacoes_adicionais">Informações Adicionais</Label>
                    <Textarea
                      id="informacoes_adicionais"
                      placeholder="Outras informações relevantes para o agente..."
                      value={formData.informacoes_adicionais}
                      onChange={(e) => setFormData({ ...formData, informacoes_adicionais: e.target.value })}
                      className="bg-secondary min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {editingId ? "Atualizar" : "Salvar"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Agents List */}
            {!error &&
              (loading ? (
                <Card className="bg-card/80 backdrop-blur-sm p-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Carregando agentes...</p>
                </Card>
              ) : agents.length === 0 ? (
                <Card className="bg-card/80 backdrop-blur-sm p-12 text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-500/10 p-4 w-fit">
                    <Bot className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Nenhum agente configurado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Crie seu primeiro agente de prospecção para começar
                  </p>
                  <Button
                    onClick={() => {
                      resetForm()
                      setShowForm(true)
                    }}
                    className="mt-6 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Agente
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className="group relative overflow-hidden border-border bg-card/80 backdrop-blur-sm p-6 transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-blue-500/10 p-2">
                          <Bot className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={agent.ativo}
                            onCheckedChange={() => handleToggleActive(agent.id, agent.ativo)}
                          />
                          <span className="text-xs text-muted-foreground">{agent.ativo ? "Ativo" : "Inativo"}</span>
                        </div>
                      </div>

                      <h3 className="mb-2 text-lg font-semibold text-foreground">{agent.nome}</h3>

                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">Início: {agent.horario_inicio || "Não definido"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span className="text-xs">Limite: {agent.limite_mensagens || 50} mensagens</span>
                        </div>
                        {agent.nichos && agent.nichos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agent.nichos.slice(0, 3).map((nicho) => (
                              <Badge key={nicho} variant="secondary" className="text-xs bg-blue-500/10 text-blue-500">
                                {nicho}
                              </Badge>
                            ))}
                            {agent.nichos.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500">
                                +{agent.nichos.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        {agent.status && agent.status.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agent.status.slice(0, 2).map((statusItem) => (
                              <Badge
                                key={statusItem}
                                variant="secondary"
                                className="text-xs bg-green-500/10 text-green-500"
                              >
                                {statusItem}
                              </Badge>
                            ))}
                            {agent.status.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                                +{agent.status.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        {agent.regiao && agent.regiao.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agent.regiao.slice(0, 2).map((regiaoItem) => (
                              <Badge
                                key={regiaoItem}
                                variant="secondary"
                                className="text-xs bg-purple-500/10 text-purple-500"
                              >
                                {regiaoItem}
                              </Badge>
                            ))}
                            {agent.regiao.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500">
                                +{agent.regiao.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestAgent(agent.id)}
                          disabled={testing === agent.id}
                          className="flex-1 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
                        >
                          {testing === agent.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Prospecção em andamento...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-3 w-3" />
                              Iniciar Prospecção
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(agent)}
                          className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(agent.id)}
                          className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
          </div>
        </main>
      </div>

      <AlertDialogCustom
        open={dialogState.open}
        onClose={closeDialog}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        details={dialogState.details}
      />
    </div>
  )
}
