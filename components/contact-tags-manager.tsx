"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { TagIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Tag {
  id: string
  nome: string
  cor: string
}

interface ContactTagsManagerProps {
  contatoId: string
  onTagsChange?: () => void
}

let tagsCache: Tag[] | null = null
let tagsCacheTime = 0
const CACHE_DURATION = 5000 // 5 segundos

let fetchingTags = false
let fetchPromise: Promise<Tag[]> | null = null

export function ContactTagsManager({ contatoId, onTagsChange }: ContactTagsManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [contactTags, setContactTags] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const { toast } = useToast()

  useEffect(() => {
    fetchAllTags()
    fetchContactTags()
  }, [contatoId])

  const fetchAllTags = async () => {
    try {
      // Usar cache se disponível e válido
      const now = Date.now()
      if (tagsCache && now - tagsCacheTime < CACHE_DURATION) {
        setAllTags(tagsCache)
        return
      }

      // Se já há uma requisição em andamento, aguardar ela
      if (fetchingTags && fetchPromise) {
        const tags = await fetchPromise
        setAllTags(tags)
        return
      }

      // Iniciar nova requisição
      fetchingTags = true
      fetchPromise = (async () => {
        const response = await fetch("/api/tags")

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Resposta não é JSON: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Muitas requisições. Aguarde um momento e tente novamente.")
          }
          throw new Error(data.error || "Erro ao buscar tags")
        }

        const tags = data.tags || []

        // Atualizar cache
        tagsCache = tags
        tagsCacheTime = Date.now()

        return tags
      })()

      const tags = await fetchPromise
      setAllTags(tags)
    } catch (error) {
      console.error("[v0] Erro ao buscar tags:", error)
      // Não mostrar toast para evitar spam de notificações
    } finally {
      fetchingTags = false
      fetchPromise = null
    }
  }

  const fetchContactTags = async () => {
    try {
      const response = await fetch(`/api/contatos/${contatoId}/tags`)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Resposta não é JSON:", response.status, response.statusText)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          console.error("[v0] Rate limit atingido ao buscar tags do contato")
          return
        }
        throw new Error(data.error || "Erro ao buscar tags do contato")
      }

      setContactTags(data.tags || [])
    } catch (error) {
      console.error("[v0] Erro ao buscar tags do contato:", error)
    }
  }

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a etiqueta",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newTagName, cor: newTagColor }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Etiqueta criada com sucesso",
        })

        setNewTagName("")
        setNewTagColor("#3b82f6")

        tagsCache = null
        await fetchAllTags()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar etiqueta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Erro ao criar tag:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar etiqueta",
        variant: "destructive",
      })
    }
  }

  const addTagToContact = async (tagId: string) => {
    try {
      console.log("[v0] Adicionando tag ao contato:", { contatoId, tagId })

      const response = await fetch(`/api/contatos/${contatoId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Resposta ao adicionar tag:", { ok: response.ok, data })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Etiqueta adicionada ao contato",
        })
        await fetchContactTags()
        onTagsChange?.()
      } else {
        throw new Error(data.error || "Erro ao adicionar etiqueta")
      }
    } catch (error) {
      console.error("[v0] Erro ao adicionar tag:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar etiqueta",
        variant: "destructive",
      })
    }
  }

  const removeTagFromContact = async (tagId: string) => {
    try {
      console.log("[v0] Removendo tag do contato:", { contatoId, tagId })

      const response = await fetch(`/api/contatos/${contatoId}/tags?tag_id=${tagId}`, {
        method: "DELETE",
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Resposta ao remover tag:", { ok: response.ok, data })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Etiqueta removida do contato",
        })
        await fetchContactTags()
        onTagsChange?.()
      } else {
        throw new Error(data.error || "Erro ao remover etiqueta")
      }
    } catch (error) {
      console.error("[v0] Erro ao remover tag:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover etiqueta",
        variant: "destructive",
      })
    }
  }

  const availableTags = allTags.filter((tag) => !contactTags.some((ct) => ct.id === tag.id))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {contactTags.map((tag) => (
          <Badge key={tag.id} style={{ backgroundColor: tag.cor }} className="gap-1 text-xs">
            {tag.nome}
            <button onClick={() => removeTagFromContact(tag.id)} className="ml-1 hover:bg-black/20 rounded-full p-0.5">
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 px-2 text-xs bg-transparent hover:bg-secondary">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Etiquetas</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Criar Nova Etiqueta</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da etiqueta"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        createTag()
                      }
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-20"
                  />
                  <Button onClick={createTag} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Etiquetas Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.cor }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => addTagToContact(tag.id)}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.nome}
                    </Badge>
                  ))}
                  {availableTags.length === 0 && contactTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma etiqueta criada. Crie uma nova etiqueta acima.
                    </p>
                  )}
                  {availableTags.length === 0 && contactTags.length > 0 && (
                    <p className="text-sm text-muted-foreground">Todas as etiquetas já foram adicionadas</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
