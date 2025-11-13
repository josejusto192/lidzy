"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, TrendingDown, CreditCard, History, Gift, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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

interface CreditPackage {
  id: string
  nome: string
  quantidade_creditos: number
  preco: number
  bonus_percentual: number
  popular: boolean
  ativo: boolean
}

interface CreditPurchase {
  id: string
  quantidade_creditos: number
  preco_pago: number
  status: string
  asaas_payment_id: string
  created_at: string
  metodo_pagamento?: string
}

export default function CreditosPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const [data, setData] = useState<CreditosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [purchases, setPurchases] = useState<CreditPurchase[]>([])
  const [purchasing, setPurchasing] = useState(false)

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
      Promise.all([
        fetchCreditos(),
        loadPackages(),
        loadPurchases()
      ])
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

  const loadPackages = async () => {
    try {
      const response = await fetch("/api/creditos/packages")
      const data = await response.json()

      if (response.ok) {
        setPackages(data.packages || [])
      } else {
        toast.error("Erro ao carregar pacotes")
      }
    } catch (error) {
      console.error("Error loading packages:", error)
      toast.error("Erro ao carregar pacotes")
    }
  }

  const loadPurchases = async () => {
    const { data, error } = await supabase
      .from("credit_purchases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error loading purchases:", error)
      return
    }

    setPurchases(data || [])
  }

  const handlePurchase = async (packageId: string) => {
    setPurchasing(true)
    try {
      const response = await fetch("/api/creditos/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          metodo_pagamento: "PIX"
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Compra iniciada! Redirecionando para pagamento...")

        // Redirect to Asaas payment page
        if (data.payment?.invoiceUrl) {
          window.open(data.payment.invoiceUrl, "_blank")
        }

        // Reload purchases
        await loadPurchases()
      } else {
        toast.error(data.error || "Erro ao processar compra")
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast.error("Erro ao processar compra")
    } finally {
      setPurchasing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      case "CONFIRMED":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmado</Badge>
      case "RECEIVED":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>
      case "OVERDUE":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

            <div className="grid gap-4 md:grid-cols-4">
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
                  <CardTitle className="text-sm font-medium">Créditos Bônus</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.creditos_bonus || 0}</div>
                  <p className="text-xs text-muted-foreground">por indicações</p>
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

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ganhe 500 créditos grátis!</h3>
                    <p className="text-sm text-muted-foreground">
                      Indique amigos e ganhe 500 créditos para cada cadastro completado.
                    </p>
                  </div>
                </div>
                <Link href="/indicacoes">
                  <Button>
                    Indicar Amigos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Tabs defaultValue="comprar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="comprar">Comprar Créditos</TabsTrigger>
                <TabsTrigger value="historico">Histórico de Transações</TabsTrigger>
                <TabsTrigger value="compras">Minhas Compras</TabsTrigger>
              </TabsList>

              <TabsContent value="comprar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pacotes de Créditos</CardTitle>
                    <CardDescription>
                      Escolha um pacote e pague com PIX ou cartão de crédito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {packages.map((pkg) => {
                        const totalCredits = pkg.quantidade_creditos + Math.floor(pkg.quantidade_creditos * (pkg.bonus_percentual / 100))
                        const bonusCredits = totalCredits - pkg.quantidade_creditos

                        return (
                          <Card
                            key={pkg.id}
                            className={pkg.popular ? "border-primary shadow-lg" : ""}
                          >
                            {pkg.popular && (
                              <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium rounded-t-lg">
                                Mais Popular
                              </div>
                            )}
                            <CardHeader>
                              <CardTitle className="text-lg">{pkg.nome}</CardTitle>
                              <div className="space-y-1">
                                <div className="text-3xl font-bold">
                                  R$ {pkg.preco.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {pkg.quantidade_creditos.toLocaleString()} créditos
                                </div>
                                {bonusCredits > 0 && (
                                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                                    +{bonusCredits} bônus
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Button
                                className="w-full"
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={purchasing || !pkg.ativo}
                              >
                                {purchasing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processando...
                                  </>
                                ) : (
                                  "Comprar Agora"
                                )}
                              </Button>
                              <p className="text-xs text-center text-muted-foreground mt-2">
                                Total: {totalCredits.toLocaleString()} créditos
                              </p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="compras" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Minhas Compras</CardTitle>
                    <CardDescription>
                      Histórico de compras de pacotes de créditos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {purchases.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma compra realizada ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {purchase.quantidade_creditos.toLocaleString()} créditos
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(purchase.created_at).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium mb-1">
                                R$ {purchase.preco_pago.toFixed(2)}
                              </div>
                              {getStatusBadge(purchase.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
