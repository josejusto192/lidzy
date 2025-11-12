"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Plus, MessageSquare, Loader2, Pencil, Check, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: number | string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Session {
  session_id: string
  title?: string
  last_message_at: string
  created_at?: string
}

const STORAGE_KEY = "lidzy_chat_v2"

export function ChatContent() {
  const [input, setInput] = useState("")
  const [messagesMap, setMessagesMap] = useState<Map<string, Message[]>>(new Map())
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef<Set<string>>(new Set())

  const currentMessages = messagesMap.get(currentSessionId) || []

  // Load sessions and localStorage on mount
  useEffect(() => {
    loadSessionsAndInit()
  }, [])

  // Save to localStorage whenever messagesMap changes
  useEffect(() => {
    if (messagesMap.size > 0) {
      const obj: Record<string, Message[]> = {}
      messagesMap.forEach((messages, sessionId) => {
        obj[sessionId] = messages
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    }
  }, [messagesMap])

  // Auto-scroll when current messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  // Load messages from database when switching to a session for the first time
  useEffect(() => {
    if (!currentSessionId || hasLoadedRef.current.has(currentSessionId)) return

    // Check if we have messages in localStorage first
    if (messagesMap.has(currentSessionId) && messagesMap.get(currentSessionId)!.length > 0) {
      hasLoadedRef.current.add(currentSessionId)
      return
    }

    // Load from database
    loadMessagesFromDatabase(currentSessionId)
  }, [currentSessionId])

  const loadSessionsAndInit = async () => {
    // Load from localStorage first
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const obj = JSON.parse(stored)
        const map = new Map<string, Message[]>()
        Object.entries(obj).forEach(([sessionId, messages]) => {
          map.set(sessionId, messages as Message[])
        })
        setMessagesMap(map)
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }

    // Load sessions from database
    try {
      const response = await fetch("/api/chat/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])

        if (data.sessions.length === 0) {
          await createNewSession()
        } else if (!currentSessionId) {
          setCurrentSessionId(data.sessions[0].session_id)
        }
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    }
  }

  const loadMessagesFromDatabase = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        const dbMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.message.role,
          content: msg.message.content,
          timestamp: msg.timestamp,
        }))

        if (dbMessages.length > 0) {
          setMessagesMap((prev) => new Map(prev).set(sessionId, dbMessages))
        }
        hasLoadedRef.current.add(sessionId)
      }
    } catch (error) {
      console.error("Error loading messages from database:", error)
    }
  }

  const createNewSession = async () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: newSessionId,
          title: "Nova Conversa",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessions([data.session, ...sessions])
        setCurrentSessionId(newSessionId)
        setMessagesMap((prev) => new Map(prev).set(newSessionId, []))
        hasLoadedRef.current.add(newSessionId)
      }
    } catch (error) {
      console.error("Error creating session:", error)
    }
  }

  const switchToSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return
    setCurrentSessionId(sessionId)
  }

  const startEditingTitle = (session: Session) => {
    setEditingSessionId(session.session_id)
    setEditingTitle(session.title || "Nova Conversa")
  }

  const saveTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) return

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: editingSessionId,
          title: editingTitle.trim(),
        }),
      })

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.session_id === editingSessionId ? { ...s, title: editingTitle.trim() } : s)),
        )
      }
    } catch (error) {
      console.error("Error updating title:", error)
    } finally {
      setEditingSessionId(null)
      setEditingTitle("")
    }
  }

  const cancelEditing = () => {
    setEditingSessionId(null)
    setEditingTitle("")
  }

  const sendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage = input.trim()
    setInput("")
    setIsSending(true)

    const userMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    }

    // Add user message to map
    setMessagesMap((prev) => {
      const newMap = new Map(prev)
      const sessionMessages = newMap.get(currentSessionId) || []
      newMap.set(currentSessionId, [...sessionMessages, userMsg])
      return newMap
    })

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          session_id: currentSessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.output) {
          const aiMsg: Message = {
            id: `temp-ai-${Date.now()}`,
            role: "assistant",
            content: data.output,
            timestamp: new Date().toISOString(),
          }

          // Add AI message to map
          setMessagesMap((prev) => {
            const newMap = new Map(prev)
            const sessionMessages = newMap.get(currentSessionId) || []
            newMap.set(currentSessionId, [...sessionMessages, aiMsg])
            return newMap
          })
        }
      } else {
        // Remove user message on error
        setMessagesMap((prev) => {
          const newMap = new Map(prev)
          const sessionMessages = newMap.get(currentSessionId) || []
          newMap.set(
            currentSessionId,
            sessionMessages.filter((msg) => msg.id !== userMsg.id),
          )
          return newMap
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove user message on error
      setMessagesMap((prev) => {
        const newMap = new Map(prev)
        const sessionMessages = newMap.get(currentSessionId) || []
        newMap.set(
          currentSessionId,
          sessionMessages.filter((msg) => msg.id !== userMsg.id),
        )
        return newMap
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="border-b border-border/40 p-4">
          <Button
            onClick={createNewSession}
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-1 p-3">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "group relative rounded-xl transition-all duration-200",
                  currentSessionId === session.session_id
                    ? "bg-primary/10 shadow-sm ring-1 ring-primary/20"
                    : "hover:bg-accent/50",
                )}
              >
                {editingSessionId === session.session_id ? (
                  <div className="flex items-center gap-2 p-3">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-8 flex-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle()
                        if (e.key === "Escape") cancelEditing()
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveTitle}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => switchToSession(session.session_id)}
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{session.title || "Nova Conversa"}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(session.last_message_at)}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingTitle(session)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl px-6 py-8">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-3 text-2xl font-semibold">Bem-vindo ao Lidzy Assistant</h3>
                <p className="max-w-md text-muted-foreground">
                  Seu assistente inteligente para prospecção de leads. Estou aqui para ajudá-lo a encontrar e gerenciar
                  seus contatos de forma eficiente.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" && "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold text-white shadow-sm",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-primary to-primary/80"
                          : "bg-gradient-to-br from-blue-600 to-blue-500",
                      )}
                    >
                      {msg.role === "assistant" ? "L" : "V"}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        {msg.role === "assistant" ? "Lidzy Assistant" : "Você"}
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm",
                          msg.role === "assistant"
                            ? "rounded-tl-md bg-card text-foreground ring-1 ring-border/50"
                            : "rounded-tr-md bg-gradient-to-br from-blue-600 to-blue-500 text-white",
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 font-semibold text-white shadow-sm">
                      L
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Lidzy Assistant</div>
                      <div className="rounded-2xl rounded-tl-md bg-card px-5 py-3.5 shadow-sm ring-1 ring-border/50">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/40 bg-card/30 backdrop-blur-sm p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-3">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-12 flex-1 rounded-xl border-border/50 bg-background px-5 text-[15px] shadow-sm focus-visible:ring-primary/20"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-sm hover:from-blue-700 hover:to-blue-600"
                onClick={sendMessage}
                disabled={isSending || !input.trim()}
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
