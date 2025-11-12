"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, MessageSquare, CheckCircle2, Coins } from "lucide-react"
import { STATUS_CONFIG } from "@/lib/status-config"
import Link from "next/link"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts"

interface DashboardStats {
  totalContatos: number
  contatosPorStatus: Record<string, number>
  faturamento: number
  totalMensagens: number
  mensagensCobradasCount: number
  mensagensPorStatus: Record<string, number>
  mensagensPorDia: Record<string, number>
  contatosRecentes: number
  contatosPorDia: Record<string, number>
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creditos, setCreditos] = useState<number>(0)

  useEffect(() => {
    fetchStats()
    fetchCreditos()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()
      if (data.error) {
        console.error("Error from API:", data.error)
        setStats(null)
      } else {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchCreditos = async () => {
    try {
      const response = await fetch("/api/creditos")
      const data = await response.json()
      if (!data.error) {
        setCreditos(data.creditos)
      }
    } catch (error) {
      console.error("Error fetching credits:", error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="p-6">Erro ao carregar estatísticas</div>
  }

  const statusChartData = stats.contatosPorStatus
    ? Object.entries(stats.contatosPorStatus).map(([status, count]) => ({
        name: STATUS_CONFIG[status]?.label || status,
        value: count,
        fill: STATUS_CONFIG[status]?.color || "#888",
      }))
    : []

  const timelineData = stats.contatosPorDia
    ? Object.entries(stats.contatosPorDia).map(([date, count]) => ({
        date,
        contatos: count,
      }))
    : []

  const mensagensStatusData = stats.mensagensPorStatus
    ? Object.entries(stats.mensagensPorStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : []

  const mensagensPorDiaData = stats.mensagensPorDia
    ? Object.entries(stats.mensagensPorDia).map(([date, count]) => ({
        date,
        mensagens: count,
      }))
    : []

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"]

  const taxaCobranca =
    stats.totalMensagens > 0 ? ((stats.mensagensCobradasCount / stats.totalMensagens) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 p-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/creditos" className="text-primary hover:underline">
                Gerenciar créditos
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContatos}</div>
            <p className="text-xs text-muted-foreground">+{stats.contatosRecentes} nos últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.faturamento)}
            </div>
            <p className="text-xs text-muted-foreground">Deals ganhos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMensagens}</div>
            <p className="text-xs text-muted-foreground">Total de mensagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Cobradas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mensagensCobradasCount}</div>
            <p className="text-xs text-muted-foreground">{taxaCobranca}% do total enviado</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalContatos > 0 && stats.contatosPorStatus
                ? (((stats.contatosPorStatus.ganho || 0) / stats.totalContatos) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Leads convertidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contatos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos Gerados (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="contatos" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {mensagensStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mensagensStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mensagensStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens Cobradas (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {mensagensPorDiaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mensagensPorDiaData}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mensagens" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
