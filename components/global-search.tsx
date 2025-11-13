"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Search, Users, MessageCircle, FolderKanban, Settings, CreditCard, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type SearchResult = {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  href: string
  type: "contact" | "conversation" | "project" | "page"
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search function
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    try {
      const searchResults: SearchResult[] = []

      // Search contacts
      const { data: contacts } = await supabase
        .from("contatos")
        .select("id, nome, email, telefone")
        .eq("user_id", user.id)
        .or(`nome.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,telefone.ilike.%${searchQuery}%`)
        .limit(5)

      if (contacts) {
        searchResults.push(
          ...contacts.map((c) => ({
            id: c.id,
            title: c.nome || "Sem nome",
            subtitle: c.email || c.telefone,
            icon: <Users className="h-4 w-4" />,
            href: `/contatos?id=${c.id}`,
            type: "contact" as const,
          }))
        )
      }

      // Search conversations
      const { data: conversations } = await supabase
        .from("conversas")
        .select("id, contact_name, contact_number")
        .eq("user_id", user.id)
        .or(`contact_name.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%`)
        .limit(5)

      if (conversations) {
        searchResults.push(
          ...conversations.map((c) => ({
            id: c.id,
            title: c.contact_name || c.contact_number,
            subtitle: "Conversa",
            icon: <MessageCircle className="h-4 w-4" />,
            href: `/conversas?id=${c.id}`,
            type: "conversation" as const,
          }))
        )
      }

      // Search projects
      const { data: projects } = await supabase
        .from("projetos")
        .select("id, nome, descricao")
        .eq("user_id", user.id)
        .ilike("nome", `%${searchQuery}%`)
        .limit(5)

      if (projects) {
        searchResults.push(
          ...projects.map((p) => ({
            id: p.id,
            title: p.nome,
            subtitle: p.descricao || "Projeto",
            icon: <FolderKanban className="h-4 w-4" />,
            href: `/projetos/${p.id}`,
            type: "project" as const,
          }))
        )
      }

      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, search])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  const pages: SearchResult[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Target className="h-4 w-4" />,
      href: "/dashboard",
      type: "page",
    },
    {
      id: "contacts",
      title: "Contatos",
      icon: <Users className="h-4 w-4" />,
      href: "/contatos",
      type: "page",
    },
    {
      id: "conversations",
      title: "Conversas",
      icon: <MessageCircle className="h-4 w-4" />,
      href: "/conversas",
      type: "page",
    },
    {
      id: "projects",
      title: "Projetos",
      icon: <FolderKanban className="h-4 w-4" />,
      href: "/projetos",
      type: "page",
    },
    {
      id: "payments",
      title: "Pagamentos",
      icon: <CreditCard className="h-4 w-4" />,
      href: "/pagamentos",
      type: "page",
    },
    {
      id: "settings",
      title: "Configurações",
      icon: <Settings className="h-4 w-4" />,
      href: "/configuracoes",
      type: "page",
    },
  ]

  const filteredPages = query
    ? pages.filter((page) => page.title.toLowerCase().includes(query.toLowerCase()))
    : pages

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar contatos, conversas, projetos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando..." : "Nenhum resultado encontrado."}
        </CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Páginas">
            {filteredPages.map((page) => (
              <CommandItem
                key={page.id}
                onSelect={() => navigate(page.href)}
                className="cursor-pointer"
              >
                {page.icon}
                <span className="ml-2">{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.filter((r) => r.type === "contact").length > 0 && (
          <CommandGroup heading="Contatos">
            {results
              .filter((r) => r.type === "contact")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => navigate(result.href)}
                  className="cursor-pointer"
                >
                  {result.icon}
                  <div className="ml-2">
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {results.filter((r) => r.type === "conversation").length > 0 && (
          <CommandGroup heading="Conversas">
            {results
              .filter((r) => r.type === "conversation")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => navigate(result.href)}
                  className="cursor-pointer"
                >
                  {result.icon}
                  <div className="ml-2">
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {results.filter((r) => r.type === "project").length > 0 && (
          <CommandGroup heading="Projetos">
            {results
              .filter((r) => r.type === "project")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => navigate(result.href)}
                  className="cursor-pointer"
                >
                  {result.icon}
                  <div className="ml-2">
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
