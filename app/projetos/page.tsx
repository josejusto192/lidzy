"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Filter,
  FolderKanban,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ContactSearchCombobox } from "@/components/contact-search-combobox"

type Projeto = {
  id: string
  nome: string
  descricao: string | null
  status: "planejamento" | "em_andamento" | "pausado" | "concluido" | "cancelado"
  prioridade: "baixa" | "media" | "alta" | "urgente"
  progresso: number
  valor_total: number | null
  data_inicio: string | null
  data_entrega_prevista: string | null
  data_fim: string | null
  contato: {
    id: string
    nome_empresa: string
    email: string | null
    telefone: string | null
  } | null
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [novoProjeto, setNovoProjeto] = useState({
    nome: "",
    descricao: "",
    contato_id: "",
    status: "planejamento",
    prioridade: "media",
    valor_total: "",
    data_inicio: "",
    data_fim_prevista: "",
  })

  useEffect(() => {
    fetchProjetos()
  }, [])

  const fetchProjetos = async () => {
    try {
      const response = await fetch("/api/projetos")
      if (!response.ok) throw new Error("Erro ao buscar projetos")
      const data = await response.json()
      if (Array.isArray(data)) {
        setProjetos(data)
      } else {
        console.error("[v0] API retornou dados inválidos:", data)
        setProjetos([])
        toast({
          title: "Aviso",
          description: "Dados de projetos inválidos recebidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar projetos:", error)
      setProjetos([])
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProjeto = async () => {
    if (!novoProjeto.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do projeto é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!novoProjeto.contato_id) {
      toast({
        title: "Erro",
        description: "Selecione um contato para o projeto",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoProjeto),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar projeto")
      }

      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso",
      })

      setIsDialogOpen(false)
      setNovoProjeto({
        nome: "",
        descricao: "",
        contato_id: "",
        status: "planejamento",
        prioridade: "media",
        valor_total: "",
        data_inicio: "",
        data_fim_prevista: "",
      })
      fetchProjetos()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o projeto",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: Projeto["status"]) => {
    const statusConfig = {
      planejamento: { label: "Planejamento", variant: "secondary" as const, icon: Clock },
      em_andamento: { label: "Em Andamento", variant: "default" as const, icon: TrendingUp },
      pausado: { label: "Pausado", variant: "outline" as const, icon: Clock },
      concluido: { label: "Concluído", variant: "default" as const, icon: CheckCircle2 },
      cancelado: { label: "Cancelado", variant: "destructive" as const, icon: AlertCircle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPrioridadeBadge = (prioridade: Projeto["prioridade"]) => {
    const prioridadeConfig = {
      baixa: { label: "Baixa", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      media: { label: "Média", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      urgente: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    }

    const config = prioridadeConfig[prioridade]

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const projetosFiltrados = Array.isArray(projetos)
    ? projetos.filter((projeto) => {
        const matchSearch =
          projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          projeto.contato?.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter === "todos" || projeto.status === statusFilter
        const matchPrioridade = prioridadeFilter === "todos" || projeto.prioridade === prioridadeFilter
        return matchSearch && matchStatus && matchPrioridade
      })
    : []

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Projetos" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
                <p className="text-muted-foreground">Gerencie todos os projetos vinculados aos seus contatos</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Projeto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Projeto</DialogTitle>
                    <DialogDescription>Adicione um novo projeto vinculado a um contato</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contato">Contato *</Label>
                      <ContactSearchCombobox
                        value={novoProjeto.contato_id}
                        onValueChange={(value) => setNovoProjeto({ ...novoProjeto, contato_id: value })}
                        placeholder="Busque e selecione um contato..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Selecione o cliente ou lead vinculado a este projeto
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome do Projeto *</Label>
                      <Input
                        id="nome"
                        value={novoProjeto.nome}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, nome: e.target.value })}
                        placeholder="Ex: Desenvolvimento de Website Institucional"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={novoProjeto.descricao}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, descricao: e.target.value })}
                        placeholder="Descreva os objetivos e escopo do projeto..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={novoProjeto.status}
                          onValueChange={(value) => setNovoProjeto({ ...novoProjeto, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planejamento">Planejamento</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="pausado">Pausado</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="prioridade">Prioridade</Label>
                        <Select
                          value={novoProjeto.prioridade}
                          onValueChange={(value) => setNovoProjeto({ ...novoProjeto, prioridade: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="valor_total">Valor Total (R$)</Label>
                      <Input
                        id="valor_total"
                        type="number"
                        step="0.01"
                        min="0"
                        value={novoProjeto.valor_total}
                        onChange={(e) => setNovoProjeto({ ...novoProjeto, valor_total: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="data_inicio">Data de Início</Label>
                        <Input
                          id="data_inicio"
                          type="date"
                          value={novoProjeto.data_inicio}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, data_inicio: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="data_fim_prevista">Previsão de Término</Label>
                        <Input
                          id="data_fim_prevista"
                          type="date"
                          value={novoProjeto.data_fim_prevista}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, data_fim_prevista: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateProjeto}>Criar Projeto</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos ou contatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="planejamento">Planejamento</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Projetos */}
            {projetosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== "todos" || prioridadeFilter !== "todos"
                      ? "Tente ajustar os filtros de busca"
                      : "Comece criando seu primeiro projeto"}
                  </p>
                  {!searchTerm && statusFilter === "todos" && prioridadeFilter === "todos" && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Projeto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projetosFiltrados.map((projeto) => (
                  <Card
                    key={projeto.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/projetos/${projeto.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-2 truncate">{projeto.nome}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {projeto.descricao || "Sem descrição"}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(projeto.status)}
                          {getPrioridadeBadge(projeto.prioridade)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progresso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{projeto.progresso}%</span>
                        </div>
                        <Progress value={projeto.progresso} className="h-2" />
                      </div>

                      {/* Contato */}
                      {projeto.contato && (
                        <div className="flex items-start gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{projeto.contato.nome_empresa}</div>
                            {projeto.contato.email && (
                              <div className="text-muted-foreground text-xs truncate">{projeto.contato.email}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Valor */}
                      {projeto.valor_total && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(projeto.valor_total)}
                          </span>
                        </div>
                      )}

                      {/* Datas */}
                      {projeto.data_entrega_prevista && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Previsão: {new Date(projeto.data_entrega_prevista).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
