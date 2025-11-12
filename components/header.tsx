"use client"

import { Moon, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/user-menu"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname()

  const getBreadcrumb = () => {
    if (pathname === "/") return "Dashboard"
    if (pathname === "/chat") return "Agente (Chat)"
    if (pathname === "/whatsapp") return "Conectar WhatsApp"
    if (pathname === "/configuracoes") return "Configurações"
    return title
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>›</span>
          <span>{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          
        </Button>
        <span className="text-sm text-muted-foreground">08 de outubro de 2025 às 22:19</span>
        <UserMenu />
      </div>
    </header>
  )
}
