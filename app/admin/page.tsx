"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Database,
  FolderKanban,
  MessageSquare,
  Bot,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface Stats {
  totalUsuarios: number
  totalContatos: number
  totalProjetos: number
  totalConversas: number
  totalAgentes: number
  usuariosAtivos: number
}

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  criado_em: string
  creditos: number
  foto_perfil: string
  assinaturas: any[]
}

interface AggregatedMetrics {
  usuariosPorMes: { mes: string; total: number }[]
  projetosPorStatus: { status: string; total: number; cor: string }[]
  contatosPorNicho: { nicho: string; total: number }[]
  creditosTotais: number
  mediaProjetosPorUsuario: number
  taxaCrescimento: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: usuario } = await supabase.from("usuarios").select("role").eq("id", user.id).single()

      if (usuario?.role !== "super_admin") {
        router.push("/")
        return
      }

      loadAdminData()
    }

    checkAdminAccess()
  }, [router, supabase])

  async function loadAdminData() {
    try {
      const [statsRes, usersRes] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/admin/users")])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setMetrics(statsData.metrics)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsuarios(usersData.usuarios)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados admin:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:pl-52">
          <Header title="Painel Admin" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-muted-foreground">Carregando painel de administração...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-52">
        <Header title="Painel Admin" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Painel de Administração</h1>
              <p className="text-muted-foreground">Visão geral de todas as atividades na plataforma</p>
              <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Conformidade LGPD:</strong> Este painel exibe apenas métricas agregadas e dados não-sensíveis.
                  Conteúdo de conversas e mensagens privadas são confidenciais e não acessíveis.
                </p>
              </div>
            </div>

            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                    <p className="text-xs text-muted-foreground">{stats.usuariosAtivos} ativos nos últimos 30 dias</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalContatos}</div>
                    <p className="text-xs text-muted-foreground">Leads gerenciados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProjetos}</div>
                    <p className="text-xs text-muted-foreground">Em andamento</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalConversas}</div>
                    <p className="text-xs text-muted-foreground">Apenas contagem (conteúdo privado)</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agentes IA</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAgentes}</div>
                    <p className="text-xs text-muted-foreground">Automatizando prospecção</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((stats.usuariosAtivos / stats.totalUsuarios) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Usuários ativos</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs defaultValue="usuarios" className="space-y-4">
              <TabsList>
                <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                <TabsTrigger value="metricas">Métricas Agregadas</TabsTrigger>
              </TabsList>

              <TabsContent value="usuarios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Todos os Usuários</CardTitle>
                    <CardDescription>Informações básicas de usuários (nome, email, plano, créditos)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {usuarios.map((usuario) => (
                        <div key={usuario.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={usuario.foto_perfil || "/placeholder.svg"} />
                              <AvatarFallback>
                                {usuario.nome
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{usuario.nome || "Sem nome"}</p>
                              <p className="text-sm text-muted-foreground">{usuario.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{usuario.creditos} créditos</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(usuario.criado_em).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant={usuario.role === "super_admin" ? "default" : "secondary"}>
                              {usuario.role === "super_admin"
                                ? "Super Admin"
                                : usuario.role === "admin"
                                  ? "Admin"
                                  : "Usuário"}
                            </Badge>
                            {usuario.assinaturas?.[0] && (
                              <Badge variant="outline">{usuario.assinaturas[0].planos?.nome}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metricas" className="space-y-4">
                {metrics && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Créditos Totais</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{metrics.creditosTotais.toLocaleString("pt-BR")}</div>
                          <p className="text-xs text-muted-foreground">Na plataforma</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Média de Projetos</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{metrics.mediaProjetosPorUsuario.toFixed(1)}</div>
                          <p className="text-xs text-muted-foreground">Por usuário</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">+{metrics.taxaCrescimento.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Usuários por Mês</CardTitle>
                          <CardDescription>Novos cadastros nos últimos 6 meses</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metrics.usuariosPorMes}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="mes" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="total" fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Projetos por Status</CardTitle>
                          <CardDescription>Distribuição atual de projetos</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={metrics.projetosPorStatus}
                                dataKey="total"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                              >
                                {metrics.projetosPorStatus.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.cor} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Contatos por Nicho</CardTitle>
                        <CardDescription>Distribuição de leads por segmento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={metrics.contatosPorNicho} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="nicho" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="total" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
