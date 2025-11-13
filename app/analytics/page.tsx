"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, MessageCircle, Target, TrendingUp, TrendingDown, Zap } from "lucide-react"
import { StatsSkeleton, ChartSkeleton } from "@/components/loading-states"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type AnalyticsData = {
  period: { days: number; startDate: string }
  contacts: { total: number; new: number; growth: number }
  conversations: { total: number; active: number; activeRate: number }
  messages: { total: number; sent: number; received: number; responseRate: number }
  agents: { total: number; active: number; leadsGenerated: number }
  credits: { available: number; usedLeads: number; usedMessages: number; total: number }
  trends: { messages: Array<{ date: string; sent: number; received: number }> }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/overview?days=${period}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
          </div>
        </div>
        <StatsSkeleton />
        <ChartSkeleton />
      </div>
    )
  }

  if (!data) {
    return <div className="container mx-auto p-6">Erro ao carregar analytics</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contacts.total.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={data.contacts.growth >= 0 ? "text-green-600" : "text-red-600"}>
                {data.contacts.growth >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {" "}{Math.abs(data.contacts.growth).toFixed(1)}%
              </span>{" "}
              {data.contacts.new} novos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversations.active.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.conversations.activeRate.toFixed(1)}% de {data.conversations.total} conversas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.messages.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.messages.received} recebidas / {data.messages.sent} enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.credits.available.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((data.credits.available / data.credits.total) * 100).toFixed(1)}% restante
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="credits">Créditos</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens ao Longo do Tempo</CardTitle>
              <CardDescription>Enviadas vs Recebidas nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends.messages}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} name="Enviadas" />
                  <Line type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={2} name="Recebidas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Agentes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.agents.active}</div>
                <p className="text-sm text-muted-foreground">de {data.agents.total} agentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.agents.leadsGenerated.toLocaleString("pt-BR")}</div>
                <p className="text-sm text-muted-foreground">por todos os agentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Média por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {data.agents.total > 0 ? Math.floor(data.agents.leadsGenerated / data.agents.total) : 0}
                </div>
                <p className="text-sm text-muted-foreground">leads por agente</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{data.credits.available.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usados em Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{data.credits.usedLeads.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usados em Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600">{data.credits.usedMessages.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
