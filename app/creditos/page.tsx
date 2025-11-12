"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, TrendingDown, CreditCard, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"

interface CreditosData {
  creditos: number
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

export default function CreditosPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const [data, setData] = useState<CreditosData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
        } else {
          setAuthLoading(false)
        }
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authLoading) {
      fetchCreditos()
    }
  }, [authLoading])

  const fetchCreditos = async () => {
    try {
      const response = await fetch("/api/creditos")
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error("Erro ao buscar créditos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      compra: "Compra",
      uso_lead: "Geração de Lead",
      uso_mensagem: "Envio de Mensagem",
      bonus: "Bônus",
      estorno: "Estorno",
      assinatura: "Assinatura",
    }
    return labels[tipo] || tipo
  }

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      compra: "default",
      bonus: "default",
      assinatura: "default",
      uso_lead: "secondary",
      uso_mensagem: "secondary",
      estorno: "outline",
    }
    return variants[tipo] || "outline"
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando créditos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Gerenciar Créditos" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gerenciar Créditos</h1>
                <p className="text-muted-foreground">
                  Gerencie seus créditos para geração de leads e envio de mensagens
                </p>
              </div>

              <Button size="lg" onClick={() => router.push("/planos")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Ver Planos
              </Button>
            </div>

            {data && data.creditos < 50 && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="text-orange-900 dark:text-orange-100">Créditos Baixos</CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    Você tem apenas {data.creditos} créditos restantes. Assine um plano para continuar usando a
                    plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push("/planos")} variant="default">
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.creditos || 0}</div>
                  <p className="text-xs text-muted-foreground">créditos disponíveis</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.creditos_leads_usados || 0}</div>
                  <p className="text-xs text-muted-foreground">créditos usados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.creditos_mensagens_usados || 0}</div>
                  <p className="text-xs text-muted-foreground">créditos usados</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
                <CardDescription>Últimas 50 transações dos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.historico && data.historico.length > 0 ? (
                        data.historico.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(item.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTipoBadge(item.tipo)}>{getTipoLabel(item.tipo)}</Badge>
                            </TableCell>
                            <TableCell>{item.descricao}</TableCell>
                            <TableCell className="text-right">
                              <span className={item.quantidade > 0 ? "text-green-600" : "text-red-600"}>
                                {item.quantidade > 0 ? "+" : ""}
                                {item.quantidade}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.saldo_novo}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhuma transação encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
