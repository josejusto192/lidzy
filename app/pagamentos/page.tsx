"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, CreditCard, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Payment {
  id: string
  value: number
  status: string
  billingType: string
  description: string
  dueDate: string
  paymentDate?: string
  invoiceUrl?: string
  bankSlipUrl?: string
}

interface Subscription {
  id: string
  status: string
  periodo: string
  data_inicio: string
  data_fim?: string
  proxima_cobranca?: string
  planos: {
    nome: string
    creditos_mensais: number
    preco_mensal: number
    preco_anual: number
  }
}

interface CreditHistory {
  id: string
  tipo: string
  quantidade: number
  saldo_anterior: number
  saldo_novo: number
  descricao: string
  created_at: string
}

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/payments/history")
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments)
        setSubscriptions(data.subscriptions)
        setCreditHistory(data.creditHistory)
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
      {
        CONFIRMED: { label: "Pago", variant: "default" },
        RECEIVED: { label: "Recebido", variant: "default" },
        PENDING: { label: "Pendente", variant: "secondary" },
        OVERDUE: { label: "Atrasado", variant: "destructive" },
        REFUNDED: { label: "Reembolsado", variant: "outline" },
        active: { label: "Ativa", variant: "default" },
        pending: { label: "Pendente", variant: "secondary" },
        canceled: { label: "Cancelada", variant: "destructive" },
        expired: { label: "Expirada", variant: "outline" },
        overdue: { label: "Atrasada", variant: "destructive" },
      }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getBillingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      BOLETO: "Boleto",
      PIX: "PIX",
      CREDIT_CARD: "Cartão de Crédito",
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p>Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
        <p className="text-muted-foreground">Acompanhe suas assinaturas, pagamentos e créditos</p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="credits">Histórico de Créditos</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhum pagamento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {payment.description}
                      </CardTitle>
                      <CardDescription>
                        Vencimento: {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                        {payment.paymentDate &&
                          ` • Pago em: ${new Date(payment.paymentDate).toLocaleDateString("pt-BR")}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(payment.value)}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Forma de pagamento: {getBillingTypeLabel(payment.billingType)}</p>
                    <div className="flex gap-2">
                      {payment.invoiceUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Fatura
                          </a>
                        </Button>
                      )}
                      {payment.bankSlipUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={payment.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Boleto
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhuma assinatura encontrada</p>
              </CardContent>
            </Card>
          ) : (
            subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{subscription.planos.nome}</CardTitle>
                      <CardDescription>
                        Período: {subscription.periodo === "monthly" ? "Mensal" : "Anual"}
                        {subscription.data_inicio && ` • Início: ${new Date(subscription.data_inicio).toLocaleDateString("pt-BR")}`}
                      </CardDescription>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Créditos mensais</p>
                      <p className="text-lg font-semibold">{subscription.planos.creditos_mensais.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          subscription.periodo === "yearly"
                            ? subscription.planos.preco_anual
                            : subscription.planos.preco_mensal
                        )}
                      </p>
                    </div>
                    {subscription.proxima_cobranca && subscription.status === "active" && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                        <p className="text-lg font-semibold">
                          {new Date(subscription.proxima_cobranca).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          {creditHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhum histórico de créditos encontrado</p>
              </CardContent>
            </Card>
          ) : (
            creditHistory.map((history) => (
              <Card key={history.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {history.tipo === "recarga" || history.tipo === "adicao" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-semibold">{history.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.created_at).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: {history.saldo_anterior.toLocaleString("pt-BR")} → {history.saldo_novo.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        history.tipo === "recarga" || history.tipo === "adicao" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {history.tipo === "recarga" || history.tipo === "adicao" ? "+" : "-"}
                      {history.quantidade.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
