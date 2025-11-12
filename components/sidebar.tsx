"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  MessageSquare,
  Phone,
  Settings,
  Bot,
  Menu,
  Coins,
  FolderKanban,
  LayoutDashboard,
  Layers,
  Shield,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client" // Added supabase client

const menuSections = [
  {
    label: "Visão Geral",
    items: [
      {
        title: "Início",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Vendas & Leads",
    items: [
      {
        title: "Contatos",
        href: "/contatos",
        icon: Users,
      },
      {
        title: "Funil (Kanban)",
        href: "/kanban",
        icon: Layers,
      },
      {
        title: "Conversas",
        href: "/conversas",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Gestão de Projetos",
    items: [
      {
        title: "Projetos",
        href: "/projetos",
        icon: FolderKanban,
      },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      {
        title: "Agentes IA",
        href: "/agentes",
        icon: Bot,
      },
      {
        title: "Instâncias WhatsApp",
        href: "/instancias",
        icon: Phone,
      },
    ],
  },
]

const footerMenuItems = [
  {
    title: "Agente (Chat)",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Créditos",
    href: "/creditos",
    icon: Coins,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    async function checkRole() {
      console.log("[v0] Checking super admin role...")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Current user:", user?.email)

      if (user) {
        const { data: usuario, error } = await supabase.from("usuarios").select("role").eq("id", user.id).single()

        console.log("[v0] Usuario data:", usuario)
        console.log("[v0] Error:", error)
        console.log("[v0] Is super admin:", usuario?.role === "super_admin")

        setIsSuperAdmin(usuario?.role === "super_admin")
      }
    }
    checkRole()
  }, [supabase])

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          {mounted && (
            <Image
              src={theme === "dark" ? "/images/logo-dark.svg" : "/images/logo-light.svg"}
              alt="Lidzy Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          )}
          {!mounted && <div className="h-10 w-28 animate-pulse rounded bg-sidebar-border" />}
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-accent/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {isSuperAdmin && (
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administração
            </h3>
            <div className="space-y-1">
              <Link
                href="/admin"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/admin"
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-accent/50",
                )}
              >
                <Shield className="h-4 w-4" />
                Painel Admin
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-1">
        {footerMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-52 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
    </>
  )
}
