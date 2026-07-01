"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

interface ExportMenuProps {
  filters: {
    status?: string
    nicho?: string
    regiao?: string
  }
}

export function ExportMenu({ filters }: ExportMenuProps) {
  const [loading, setLoading] = useState(false)

  const exportar = async (formato: "csv" | "lookalike") => {
    setLoading(true)
    try {
      const body: Record<string, unknown> = { formato, limite: 10000 }

      if (filters.status && filters.status !== "todos") body.status = filters.status
      if (filters.nicho && filters.nicho !== "todos") body.nicho = filters.nicho
      if (filters.regiao && filters.regiao !== "todos") body.regiao = filters.regiao

      const res = await fetch("/api/contatos/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Erro ao exportar")
        return
      }

      const blob = await res.blob()
      const filename = formato === "lookalike"
        ? `lookalike_${new Date().toISOString().slice(0, 10)}.csv`
        : `leads_${new Date().toISOString().slice(0, 10)}.csv`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success(
        formato === "lookalike"
          ? "Arquivo lookalike exportado! Pronto para importar no Meta Ads."
          : "Leads exportados com sucesso!"
      )
    } catch {
      toast.error("Não foi possível exportar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="gap-2 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar contatos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportar("csv")}>
          <Download className="mr-2 h-4 w-4" />
          CSV completo
          <span className="ml-auto text-xs text-muted-foreground">todos os campos</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Lookalike
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportar("lookalike")}>
          <Users className="mr-2 h-4 w-4 text-blue-500" />
          Meta Ads (Facebook)
          <span className="ml-auto text-xs text-muted-foreground">email, phone, fn…</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
