"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, MessageCircle, TrendingDown, History } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"

const WHATSAPP_URL = "https://wa.me/5515991485349"

interface CreditosData {
  creditos: number
  creditos_bonus?: number
  creditos_leads_usados: number
  creditos_mensagens_usados: number
  historico: Array<{
    id: string
    tipo: string
    quantidade: number
    saldo_anterior: number
    saldo_novo: number
    descricao: string
    created_at: string
  }>
}

function buildWhatsAppMessage(creditos: number) {
  const text = encodeURIComponent(
    `Olá! Sou usuário da Lidzy e gostaria de solicitar mais créditos.\n\nMeu saldo atual: ${creditos} créditos.`
  )
  return `${WHATSAPP_URL}?text=${text}`
}

export default function CreditosPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [authLoading, setAuthLoading] = useState(true)
  const [data, setData] = useState<CreditosData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/login")
      else setAuthLoading(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authLoading) fetchCreditos()
  }, [authLoading])

  const fetchCreditos = async () => {
    try {
      const res = await fetch("/api/creditos")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const creditos = data?.creditos ?? 0
  const creditosBonus = data?.creditos_bonus ?? 0
  const totalCreditos = creditos + creditosBonus

  const tipoLabel: Record<string, string> = {
    uso_lead: "Leads gerados",
    uso_mensagem: "Mensagens enviadas",
    compra: "Compra de créditos",
    bonus_indicacao: "Bônus de indicação",
    bonus_indicado: "Bônus por indicação",
    recarga_manual: "Recarga manual",
    assinatura: "Créditos do plano",
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Coins className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* Saldo atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Seus Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-6xl font-bold text-foreground">{totalCreditos.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">créditos disponíveis</span>
                  {creditosBonus > 0 && (
                    <span className="text-xs text-yellow-500">
                      inclui {creditosBonus} de bônus
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-muted-foreground">Leads gerados</p>
                    <p className="text-xl font-semibold">{(data?.creditos_leads_usados ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-muted-foreground">Mensagens enviadas</p>
                    <p className="text-xl font-semibold">{(data?.creditos_mensagens_usados ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solicitar créditos */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Solicitar Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Durante o período de testes, os créditos são adicionados manualmente.
                  Entre em contato via WhatsApp para solicitar uma recarga.
                </p>
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <a href={buildWhatsAppMessage(totalCreditos)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Solicitar créditos via WhatsApp
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Atendimento rápido — resposta em até algumas horas
                </p>
              </CardContent>
            </Card>

            {/* Histórico */}
            {data?.historico && data.historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Histórico de Uso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.historico.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            {item.descricao || tipoLabel[item.tipo] || item.tipo}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={item.quantidade >= 0 ? "text-green-500" : "text-red-500"}>
                              {item.quantidade >= 0 ? "+" : ""}{item.quantidade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {item.saldo_novo}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {data?.historico?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <TrendingDown className="h-8 w-8" />
                <p className="text-sm">Nenhum uso de créditos ainda.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
