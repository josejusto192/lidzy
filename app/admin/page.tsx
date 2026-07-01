"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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
  TrendingDown,
  Coins,
  Receipt,
  Wallet,
  ShieldBan,
  Trash2,
  CreditCard,
  Eye,
  ChevronRight,
  ShieldCheck,
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

const CUSTO_POR_CREDITO_BRL = 0.006 // R$0,006 por crédito (média Serper + CDD)

interface FinanceiroData {
  mrr: number
  creditosUsadosMes: number
  creditosLeadsMes: number
  creditosMensagensMes: number
  custoApiMes: number
  topUsuarios: { id: string; nome: string; email: string; creditosMes: number; custoMes: number }[]
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
  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null)
  const [custosFixos, setCustosFixos] = useState(600)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [userAtividade, setUserAtividade] = useState<any>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [creditosInput, setCreditosInput] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState("")
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
      const [statsRes, usersRes, finRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/financeiro"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setMetrics(statsData.metrics)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsuarios(usersData.usuarios)
      }

      if (finRes.ok) {
        setFinanceiro(await finRes.json())
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados admin:", error)
    } finally {
      setLoading(false)
    }
  }

  async function openUserDialog(u: Usuario) {
    setSelectedUser(u)
    setUserAtividade(null)
    setCreditosInput(String(u.creditos))
    setActionMsg("")
    setUserDialogOpen(true)
    const res = await fetch(`/api/admin/usuarios/${u.id}/atividade`)
    if (res.ok) setUserAtividade(await res.json())
  }

  async function handleCreditUpdate() {
    if (!selectedUser) return
    setActionLoading(true)
    setActionMsg("")
    const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditos: Number(creditosInput), descricao: "Ajuste manual de créditos pelo admin" }),
    })
    if (res.ok) {
      setActionMsg("Créditos atualizados!")
      setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, creditos: Number(creditosInput) } : u))
      setSelectedUser(prev => prev ? { ...prev, creditos: Number(creditosInput) } : prev)
    } else {
      const d = await res.json()
      setActionMsg(d.error || "Erro")
    }
    setActionLoading(false)
  }

  async function handleBan() {
    if (!selectedUser || !confirm(`Banir ${selectedUser.nome || selectedUser.email}?`)) return
    setActionLoading(true)
    const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setActionMsg("Usuário banido.")
      setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: "banned" } : u))
    }
    setActionLoading(false)
  }

  async function handleDelete() {
    if (!selectedUser || !confirm(`DELETAR permanentemente ${selectedUser.nome || selectedUser.email}? Esta ação não pode ser desfeita.`)) return
    setActionLoading(true)
    const res = await fetch(`/api/admin/usuarios/${selectedUser.id}?hard=true`, { method: "DELETE" })
    if (res.ok) {
      setUserDialogOpen(false)
      setUsuarios(prev => prev.filter(u => u.id !== selectedUser.id))
    }
    setActionLoading(false)
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
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>

              <TabsContent value="usuarios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Todos os Usuários</CardTitle>
                    <CardDescription>Clique em um usuário para gerenciar créditos, banir ou ver atividade</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Créditos</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Plano</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Role</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cadastro</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map((usuario) => (
                          <tr key={usuario.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => openUserDialog(usuario)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={usuario.foto_perfil || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {usuario.nome?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{usuario.nome || "Sem nome"}</p>
                                  <p className="text-xs text-muted-foreground">{usuario.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{(usuario.creditos ?? 0).toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-3 text-center">
                              {usuario.assinaturas?.[0] ? (
                                <Badge variant="outline">{usuario.assinaturas[0].planos?.nome}</Badge>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={(usuario as any).role === "super_admin" ? "default" : (usuario as any).role === "banned" ? "destructive" : "secondary"}>
                                {(usuario as any).role === "super_admin" ? "Admin" : (usuario as any).role === "banned" ? "Banido" : "Usuário"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                              {new Date(usuario.criado_em).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Dialog de gestão do usuário */}
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {selectedUser?.nome?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {selectedUser?.nome || "Usuário"}
                      </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                      <div className="space-y-5">
                        {/* Info básica */}
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>{selectedUser.email}</p>
                          <p>Cadastro: {new Date(selectedUser.criado_em).toLocaleDateString("pt-BR")}</p>
                        </div>

                        {/* Stats de atividade */}
                        {userAtividade ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-secondary p-3 text-center">
                              <p className="text-xl font-bold">{userAtividade.stats.totalContatos}</p>
                              <p className="text-xs text-muted-foreground">Contatos</p>
                            </div>
                            <div className="rounded-lg bg-secondary p-3 text-center">
                              <p className="text-xl font-bold">{userAtividade.stats.totalProjetos}</p>
                              <p className="text-xs text-muted-foreground">Projetos</p>
                            </div>
                            <div className="rounded-lg bg-secondary p-3 text-center">
                              <p className="text-xl font-bold">{(userAtividade.usuario?.creditos_leads_usados ?? 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Leads gerados</p>
                            </div>
                            <div className="rounded-lg bg-secondary p-3 text-center">
                              <p className="text-xl font-bold">{(userAtividade.usuario?.creditos_mensagens_usados ?? 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Msgs enviadas</p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">Carregando atividade...</div>
                        )}

                        <Separator />

                        {/* Liberar créditos */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 font-semibold">
                            <CreditCard className="h-4 w-4" />
                            Créditos
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={creditosInput}
                              onChange={e => setCreditosInput(e.target.value)}
                              className="w-36"
                            />
                            <Button size="sm" onClick={handleCreditUpdate} disabled={actionLoading}>
                              Salvar
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Saldo atual: {selectedUser.creditos?.toLocaleString("pt-BR")} créditos</p>
                        </div>

                        {/* Histórico resumido */}
                        {userAtividade?.historico?.length > 0 && (
                          <div className="space-y-2">
                            <Label className="font-semibold">Últimas movimentações</Label>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                              {userAtividade.historico.map((h: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                                  <span className="text-muted-foreground">{h.descricao || h.tipo}</span>
                                  <span className={h.quantidade >= 0 ? "text-green-500 font-mono" : "text-red-500 font-mono"}>
                                    {h.quantidade >= 0 ? "+" : ""}{h.quantidade}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {actionMsg && <p className="text-sm text-green-500">{actionMsg}</p>}

                        <Separator />

                        {/* Ações destrutivas */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10" onClick={handleBan} disabled={actionLoading}>
                            <ShieldBan className="h-4 w-4" />
                            Banir usuário
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={handleDelete} disabled={actionLoading}>
                            <Trash2 className="h-4 w-4" />
                            Deletar conta
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
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
              <TabsContent value="financeiro" className="space-y-6">
                {/* Custo fixo editável */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Custos Fixos Mensais
                    </CardTitle>
                    <CardDescription>VPS, IA, domínio e outros — edite conforme necessidade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 max-w-xs">
                      <Label className="text-sm whitespace-nowrap">R$</Label>
                      <Input
                        type="number"
                        value={custosFixos}
                        onChange={e => setCustosFixos(Number(e.target.value))}
                        className="w-32"
                      />
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Custo por crédito (API): R$ {CUSTO_POR_CREDITO_BRL.toFixed(4)} (média Serper + CDD)
                    </p>
                  </CardContent>
                </Card>

                {financeiro && (() => {
                  const custoTotal = financeiro.custoApiMes + custosFixos
                  const lucro = financeiro.mrr - custoTotal
                  const margemPct = financeiro.mrr > 0 ? (lucro / financeiro.mrr) * 100 : 0

                  return (
                    <>
                      {/* KPIs */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">MRR</CardTitle>
                            <Wallet className="h-4 w-4 text-green-500" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              R$ {financeiro.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                              R$ {custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              API R$ {financeiro.custoApiMes.toFixed(2)} + fixo R$ {custosFixos.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${lucro >= 0 ? "text-green-600" : "text-red-500"}`}>
                              R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">MRR − custos do mês</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margem</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${margemPct >= 50 ? "text-green-600" : margemPct >= 0 ? "text-yellow-500" : "text-red-500"}`}>
                              {margemPct.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Margem líquida estimada</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Uso de créditos no mês */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            Uso de Créditos — Mês Atual
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="rounded-lg bg-secondary p-4">
                              <p className="text-2xl font-bold">{financeiro.creditosUsadosMes.toLocaleString("pt-BR")}</p>
                              <p className="text-xs text-muted-foreground mt-1">Total consumido</p>
                            </div>
                            <div className="rounded-lg bg-secondary p-4">
                              <p className="text-2xl font-bold">{financeiro.creditosLeadsMes.toLocaleString("pt-BR")}</p>
                              <p className="text-xs text-muted-foreground mt-1">Leads gerados</p>
                            </div>
                            <div className="rounded-lg bg-secondary p-4">
                              <p className="text-2xl font-bold">{financeiro.creditosMensagensMes.toLocaleString("pt-BR")}</p>
                              <p className="text-xs text-muted-foreground mt-1">Mensagens enviadas</p>
                            </div>
                          </div>
                          <p className="mt-3 text-center text-xs text-muted-foreground">
                            Custo de API estimado: <span className="font-medium text-foreground">R$ {financeiro.custoApiMes.toFixed(2)}</span>
                            {" "}({financeiro.creditosUsadosMes.toLocaleString("pt-BR")} × R$ {CUSTO_POR_CREDITO_BRL})
                          </p>
                        </CardContent>
                      </Card>

                      {/* Top usuários por consumo */}
                      {financeiro.topUsuarios.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Top Usuários por Consumo (mês)</CardTitle>
                            <CardDescription>Usuários que mais usaram créditos este mês</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Créditos</th>
                                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Custo API</th>
                                </tr>
                              </thead>
                              <tbody>
                                {financeiro.topUsuarios.map(u => (
                                  <tr key={u.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                      <p className="font-medium">{u.nome || "—"}</p>
                                      <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{u.creditosMes.toLocaleString("pt-BR")}</td>
                                    <td className="px-4 py-3 text-right font-mono text-red-500">
                                      R$ {u.custoMes.toFixed(3)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
