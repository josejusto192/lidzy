"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Send,
  Search,
  Phone,
  Bot,
  MessageSquare,
  Plus,
  Eye,
  AlertTriangle,
  Wifi,
  WifiOff,
  Sparkles,
  Loader2,
  Upload,
  X,
  Camera,
  TagIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"

interface Conversa {
  id: string
  phone: string
  contato_id: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  photo: string | null
  chat_name: string | null
  contatos: {
    id: string
    nome_empresa: string
    nicho: string | null
    status: string | null
  } | null
  agentes_prospeccao: {
    nome: string
  } | null
  instancias: {
    nome: string
  } | null
}

interface Mensagem {
  id: string
  message_id: string
  from_me: boolean
  message: string
  status: string
  timestamp: string
}

export default function ConversasPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversaIdFromUrl = searchParams.get("id")

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [selectedConversa, setSelectedConversa] = useState<string | null>(conversaIdFromUrl)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAgente, setFilterAgente] = useState<string>("todos")
  const [filterInstancia, setFilterInstancia] = useState<string>("todos")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [contactForm, setContactForm] = useState({
    nome_empresa: "",
    email: "",
    endereco: "",
    nicho: "",
    origem: "manual" as string,
  })
  const [savingContact, setSavingContact] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const supabaseRef = useRef(createClient())
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false)
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; nome: string; cor: string }>>([])
  const [loadingTags, setLoadingTags] = useState(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    loadConversas()
    loadAgents()
    loadTags()
  }, [])

  useEffect(() => {
    if (conversaIdFromUrl && conversas.length > 0) {
      const conversaExists = conversas.find((c) => c.id === conversaIdFromUrl)
      if (conversaExists) {
        setSelectedConversa(conversaIdFromUrl)
      }
    }
  }, [conversaIdFromUrl, conversas])

  useEffect(() => {
    if (!selectedConversa) return

    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`mensagens-${selectedConversa}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensagens",
          filter: `conversa_id=eq.${selectedConversa}`,
        },
        (payload) => {
          console.log("[v0] Realtime message update:", payload)

          if (payload.eventType === "INSERT") {
            setMensagens((prev) => {
              const filtered = prev.filter((m) => !m.id.startsWith("temp-"))
              return [...filtered, payload.new as Mensagem]
            })
          } else if (payload.eventType === "UPDATE") {
            setMensagens((prev) => prev.map((m) => (m.id === payload.new.id ? (payload.new as Mensagem) : m)))
          } else if (payload.eventType === "DELETE") {
            setMensagens((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Realtime status:", status)
        setRealtimeConnected(status === "SUBSCRIBED")
      })

    loadMensagens(selectedConversa)

    return () => {
      console.log("[v0] Cleaning up realtime subscription")
      supabase.removeChannel(channel)
      setRealtimeConnected(false)
    }
  }, [selectedConversa])

  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel("conversas-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversas",
        },
        (payload) => {
          console.log("[v0] Realtime conversa update:", payload)
          loadConversas()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedConversa) {
      loadMensagens(selectedConversa)
    }
  }, [selectedConversa])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens, scrollToBottom])

  const loadConversas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/conversas")
      if (response.ok) {
        const data = await response.json()
        setConversas(data)
      }
    } catch (error) {
      console.error("[v0] Error loading conversas:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMensagens = async (conversaId: string) => {
    try {
      const response = await fetch(`/api/conversas/${conversaId}/mensagens`)

      if (!response.ok) {
        setMensagens([])
        return
      }

      const data = await response.json()
      setMensagens((prevMensagens) => {
        const optimisticMessages = prevMensagens.filter((m) => m.id.startsWith("temp-"))
        const serverMessages = data.filter((m: Mensagem) => !m.id.startsWith("temp-"))
        return [...serverMessages, ...optimisticMessages]
      })
    } catch (error) {
      console.error("[v0] Error loading mensagens:", error)
      setMensagens([])
    }
  }

  const handleRefresh = async () => {
    setRealtimeConnected(false)
    await loadConversas()
    if (selectedConversa) {
      await loadMensagens(selectedConversa)
    }
    setRealtimeConnected(true)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversa || sending) return

    const optimisticMessage: Mensagem = {
      id: `temp-${Date.now()}`,
      message_id: "",
      from_me: true,
      message: newMessage,
      status: "ENVIANDO",
      timestamp: new Date().toISOString(),
    }

    const messageToSend = newMessage
    setMensagens((prev) => [...prev, optimisticMessage])
    setNewMessage("")
    scrollToBottom()

    setSending(true)
    try {
      const response = await fetch(`/api/conversas/${selectedConversa}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      })

      if (response.ok) {
        setMensagens((prev) => prev.map((m) => (m.id === optimisticMessage.id ? { ...m, status: "ENVIADA" } : m)))
      } else {
        setMensagens((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
        setNewMessage(messageToSend)
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMensagens((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(messageToSend)
    } finally {
      setSending(false)
    }
  }

  const handleSaveContact = async () => {
    if (!selectedConversaData || !contactForm.nome_empresa.trim()) return

    setSavingContact(true)
    try {
      let photoUrl: string | undefined = undefined
      if (photoFile) {
        try {
          const blob = await put(photoFile.name, photoFile, {
            access: "public",
          })
          photoUrl = blob.url
        } catch (error) {
          console.error("[v0] Erro ao fazer upload da foto:", error)
        }
      }

      if (selectedConversaData.contatos) {
        const response = await fetch("/api/contatos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedConversaData.contatos.id,
            ...contactForm,
            ...(photoUrl && { photo: photoUrl }),
          }),
        })

        if (response.ok) {
          setShowContactDialog(false)
          setIsEditingContact(false)
          setContactForm({ nome_empresa: "", email: "", endereco: "", nicho: "", origem: "manual" })
          setPhotoFile(null)
          setPhotoPreview(null)
          setSelectedTags([])
          loadConversas()
        }
      } else {
        const response = await fetch("/api/contatos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...contactForm,
            telefone: selectedConversaData.phone,
            ...(photoUrl && { photo: photoUrl }),
          }),
        })

        if (response.ok) {
          const newContact = await response.json()

          if (selectedTags.length > 0) {
            for (const tagId of selectedTags) {
              try {
                await fetch(`/api/contatos/${newContact.id}/tags`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tag_id: tagId }),
                })
              } catch (error) {
                console.error("[v0] Erro ao adicionar tag:", error)
              }
            }
          }

          await fetch(`/api/conversas/${selectedConversa}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contato_id: newContact.id }),
          })

          setShowContactDialog(false)
          setContactForm({ nome_empresa: "", email: "", endereco: "", nicho: "", origem: "manual" })
          setPhotoFile(null)
          setPhotoPreview(null)
          setSelectedTags([])
          loadConversas()
        }
      }
    } catch (error) {
      console.error("[v0] Error saving contact:", error)
    } finally {
      setSavingContact(false)
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
      const activeAgents = data.agentes.filter((agent: any) => agent.ativo)
      setAgents(activeAgents)
    } catch (err) {
      console.error("[v0] Erro ao carregar agentes:", err)
    }
  }

  const loadTags = async () => {
    try {
      setLoadingTags(true)
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar tags:", error)
    } finally {
      setLoadingTags(false)
    }
  }

  const handleSendMessageWithAI = async () => {
    if (!selectedAgentId || !selectedLeadForMessage) {
      alert("Por favor, selecione um agente antes de enviar a mensagem.")
      return
    }

    console.log("[v0] Iniciando envio de mensagem com IA para:", {
      conversaId: selectedLeadForMessage.id,
      phone: selectedLeadForMessage.phone,
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

      const webhookPayload = {
        agente: fullAgent,
        contato: {
          id: selectedLeadForMessage.contato_id,
          nome_empresa: selectedLeadForMessage.contatos?.nome_empresa || selectedLeadForMessage.chat_name,
          telefone: selectedLeadForMessage.phone,
          nicho: selectedLeadForMessage.contatos?.nicho,
          status: selectedLeadForMessage.contatos?.status,
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

      alert("Mensagem adicionada à fila! Acompanhe o status na conversa.")

      await loadConversas()
    } catch (err) {
      console.error("[v0] Erro ao enviar mensagem:", err)
      alert("Não foi possível enviar a mensagem. Tente novamente.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const filteredConversas = useMemo(() => {
    return conversas.filter((conversa) => {
      const matchesSearch =
        conversa.contatos?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversa.phone.includes(searchTerm)
      const matchesAgente = filterAgente === "todos" || conversa.agentes_prospeccao?.nome === filterAgente
      const matchesInstancia = filterInstancia === "todos" || conversa.instancias?.nome === filterInstancia
      return matchesSearch && matchesAgente && matchesInstancia
    })
  }, [conversas, searchTerm, filterAgente, filterInstancia])

  const selectedConversaData = useMemo(
    () => conversas.find((c) => c.id === selectedConversa),
    [conversas, selectedConversa],
  )

  const agentes = useMemo(
    () => Array.from(new Set(conversas.map((c) => c.agentes_prospeccao?.nome).filter(Boolean))),
    [conversas],
  )
  const instancias = useMemo(
    () => Array.from(new Set(conversas.map((c) => c.instancias?.nome).filter(Boolean))),
    [conversas],
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-52">
        <Header />
        <main className="flex-1 bg-background" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="flex h-full flex-col lg:flex-row">
            <div className="w-full border-b border-border bg-card lg:w-96 lg:border-b-0 lg:border-r flex-shrink-0">
              <div className="flex h-full flex-col">
                {/* Search and Filters */}
                <div className="space-y-3 border-b border-border p-3 md:p-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!realtimeConnected}>
                      {realtimeConnected ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className={cn("h-2 w-2 rounded-full", realtimeConnected ? "bg-green-500" : "bg-gray-400")} />
                      {realtimeConnected ? "Tempo real" : "Conectando..."}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={filterAgente} onValueChange={setFilterAgente}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Agente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {agentes.map((agente) => (
                          <SelectItem key={agente} value={agente!}>
                            {agente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterInstancia} onValueChange={setFilterInstancia}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Instância" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {instancias.map((instancia) => (
                          <SelectItem key={instancia} value={instancia!}>
                            {instancia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ScrollArea className="flex-1 max-h-[40vh] lg:max-h-none">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Carregando conversas...</div>
                  ) : filteredConversas.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredConversas.map((conversa) => (
                        <button
                          key={conversa.id}
                          onClick={() => setSelectedConversa(conversa.id)}
                          className={cn(
                            "w-full p-3 md:p-4 text-left transition-colors hover:bg-accent/50",
                            selectedConversa === conversa.id && "bg-accent",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage
                                src={conversa.photo || undefined}
                                alt={conversa.contatos?.nome_empresa || conversa.chat_name || conversa.phone}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {(conversa.contatos?.nome_empresa || conversa.chat_name || conversa.phone)
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {conversa.contatos?.nome_empresa || conversa.chat_name || conversa.phone}
                                </p>
                                {conversa.unread_count > 0 && (
                                  <Badge variant="default" className="h-5 min-w-5 px-1.5">
                                    {conversa.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">
                                {conversa.last_message || "Sem mensagens"}
                              </p>
                              {(conversa.agentes_prospeccao?.nome || conversa.instancias?.nome) && (
                                <div className="flex items-center gap-1 mt-2">
                                  {conversa.agentes_prospeccao?.nome && (
                                    <Badge variant="outline" className="text-xs">
                                      <Bot className="h-3 w-3 mr-1" />
                                      {conversa.agentes_prospeccao?.nome}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(conversa.last_message_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedConversa && selectedConversaData ? (
                <>
                  <div className="sticky top-0 z-10 border-b border-border bg-card p-3 md:p-4 flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage
                            src={selectedConversaData.photo || undefined}
                            alt={
                              selectedConversaData.contatos?.nome_empresa ||
                              selectedConversaData.chat_name ||
                              selectedConversaData.phone
                            }
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(
                              selectedConversaData.contatos?.nome_empresa ||
                              selectedConversaData.chat_name ||
                              selectedConversaData.phone
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg md:text-xl font-semibold truncate">
                            {selectedConversaData.contatos?.nome_empresa ||
                              selectedConversaData.chat_name ||
                              selectedConversaData.phone}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs md:text-sm text-muted-foreground truncate">
                              {selectedConversaData.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedConversaData.contatos ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/contatos/${selectedConversaData.contatos!.id}`)}
                          className="flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Ver Detalhes</span>
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setShowContactDialog(true)} className="flex-shrink-0">
                          <Plus className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Criar Contato</span>
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedLeadForMessage(selectedConversaData)
                          setSendMessageModalOpen(true)
                        }}
                        className="flex-shrink-0"
                      >
                        <Sparkles className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Enviar com IA</span>
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 bg-background">
                    {mensagens.some((m) => m.status === "ERRO") && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Algumas mensagens não puderam ser entregues
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {mensagens.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma mensagem ainda</p>
                          </div>
                        </div>
                      ) : (
                        mensagens.map((mensagem) => (
                          <div
                            key={mensagem.id}
                            className={cn("flex", mensagem.from_me ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] md:max-w-[70%] rounded-lg px-3 md:px-4 py-2",
                                mensagem.status === "ERRO"
                                  ? "bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800"
                                  : mensagem.from_me
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">{mensagem.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(mensagem.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {mensagem.from_me && <span className="text-xs opacity-70">{mensagem.status}</span>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-border bg-card p-3 md:p-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        disabled={sending}
                      />
                      <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {!selectedConversaData?.contatos && (
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Contato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Photo upload section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={photoPreview || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      <Camera className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  {photoPreview && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {photoPreview ? "Alterar Foto" : "Adicionar Foto"}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              <div>
                <Label>Nome da Empresa *</Label>
                <Input
                  value={contactForm.nome_empresa}
                  onChange={(e) => setContactForm({ ...contactForm, nome_empresa: e.target.value })}
                />
              </div>
              <div>
                <Label>Nicho</Label>
                <Input
                  value={contactForm.nicho}
                  onChange={(e) => setContactForm({ ...contactForm, nicho: e.target.value })}
                />
              </div>

              {/* Origin selector */}
              <div>
                <Label>Origem do Contato</Label>
                <Select
                  value={contactForm.origem}
                  onValueChange={(value) => setContactForm({ ...contactForm, origem: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scraping">Scraping</SelectItem>
                    <SelectItem value="importacao">Importação</SelectItem>
                    <SelectItem value="agente_ia">Agente IA</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags selector */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <TagIcon className="h-4 w-4" />
                  Etiquetas
                </Label>
                {loadingTags ? (
                  <p className="text-sm text-muted-foreground">Carregando etiquetas...</p>
                ) : availableTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma etiqueta disponível. Crie etiquetas na página de contatos.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.cor : "transparent",
                          color: selectedTags.includes(tag.id) ? "white" : tag.cor,
                          borderColor: tag.cor,
                          borderWidth: "1px",
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.nome}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowContactDialog(false)
                    setContactForm({ nome_empresa: "", email: "", endereco: "", nicho: "", origem: "manual" })
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setSelectedTags([])
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveContact} disabled={savingContact || !contactForm.nome_empresa.trim()}>
                  {savingContact ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de enviar mensagem com IA */}
      <Dialog open={sendMessageModalOpen} onOpenChange={setSendMessageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem com IA</DialogTitle>
          </DialogHeader>

          {selectedLeadForMessage && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {selectedLeadForMessage.contatos?.nome_empresa ||
                    selectedLeadForMessage.chat_name ||
                    selectedLeadForMessage.phone}
                </p>
                <p className="text-xs text-muted-foreground">{selectedLeadForMessage.phone}</p>
                {selectedLeadForMessage.contatos?.nicho && (
                  <p className="text-xs text-muted-foreground">{selectedLeadForMessage.contatos.nicho}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Selecione o Agente</Label>
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
                <Button onClick={handleSendMessageWithAI} disabled={isSendingMessage || !selectedAgentId}>
                  {isSendingMessage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
