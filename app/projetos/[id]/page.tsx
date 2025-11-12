"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  MoreVertical,
  Plus,
  Trash2,
  User,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

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
  contatos_projetos: Array<{
    contatos: {
      id: string
      nome_empresa: string
      email: string | null
      telefone: string | null
    }
  }>
}

type Tarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: "pendente" | "em_andamento" | "concluida" | "cancelada"
  prioridade: "baixa" | "media" | "alta" | "urgente"
  data_prevista: string | null
  data_conclusao: string | null
}

export default function ProjetoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)

  const [editForm, setEditForm] = useState({
    nome: "",
    descricao: "",
    status: "",
    prioridade: "",
    valor_total: "",
    data_inicio: "",
    data_entrega_prevista: "",
  })

  const [taskForm, setTaskForm] = useState({
    titulo: "",
    descricao: "",
    status: "pendente",
    prioridade: "media",
    data_prevista: "",
  })

  useEffect(() => {
    fetchProjeto()
    fetchTarefas()
  }, [params.id])

  const fetchProjeto = async () => {
    try {
      const response = await fetch(`/api/projetos/${params.id}`)
      if (!response.ok) throw new Error("Erro ao buscar projeto")
      const data = await response.json()
      setProjeto(data)
      setEditForm({
        nome: data.nome,
        descricao: data.descricao || "",
        status: data.status,
        prioridade: data.prioridade,
        valor_total: data.valor_total?.toString() || "",
        data_inicio: data.data_inicio || "",
        data_entrega_prevista: data.data_entrega_prevista || "",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o projeto",
        variant: "destructive",
      })
      router.push("/projetos")
    } finally {
      setLoading(false)
    }
  }

  const fetchTarefas = async () => {
    try {
      const response = await fetch(`/api/projetos/${params.id}/tarefas`)
      if (!response.ok) throw new Error("Erro ao buscar tarefas")
      const data = await response.json()
      setTarefas(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar tarefas:", error)
    }
  }

  const handleUpdateProjeto = async () => {
    try {
      const response = await fetch(`/api/projetos/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          valor_total: editForm.valor_total ? Number.parseFloat(editForm.valor_total) : null,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar projeto")

      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso",
      })

      setIsEditDialogOpen(false)
      fetchProjeto()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      })
    }
  }

  const handleQuickStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/projetos/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar status")

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      })

      fetchProjeto()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = async () => {
    if (!taskForm.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Título da tarefa é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/projetos/${params.id}/tarefas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      })

      if (!response.ok) throw new Error("Erro ao criar tarefa")

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      })

      setIsTaskDialogOpen(false)
      setTaskForm({
        titulo: "",
        descricao: "",
        status: "pendente",
        prioridade: "media",
        data_prevista: "",
      })
      fetchTarefas()
      fetchProjeto()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa",
        variant: "destructive",
      })
    }
  }

  const handleToggleTaskStatus = async (tarefa: Tarefa) => {
    const newStatus = tarefa.status === "concluida" ? "pendente" : "concluida"

    try {
      const response = await fetch(`/api/projetos/tarefas/${tarefa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          data_conclusao: newStatus === "concluida" ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar tarefa")

      fetchTarefas()
      fetchProjeto()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (tarefaId: string) => {
    try {
      const response = await fetch(`/api/projetos/tarefas/${tarefaId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar tarefa")

      toast({
        title: "Sucesso",
        description: "Tarefa deletada com sucesso",
      })

      fetchTarefas()
      fetchProjeto()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a tarefa",
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

  if (loading || !projeto) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  const contato = projeto.contatos_projetos[0]?.contatos

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title={projeto.nome} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push("/projetos")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleQuickStatusChange("planejamento")}>
                      Mover para Planejamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickStatusChange("em_andamento")}>
                      Mover para Em Andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickStatusChange("pausado")}>
                      Pausar Projeto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickStatusChange("concluido")}>
                      Marcar como Concluído
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Projeto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Informações Principais */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{projeto.nome}</CardTitle>
                      <CardDescription>{projeto.descricao || "Sem descrição"}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(projeto.status)}
                      {getPrioridadeBadge(projeto.prioridade)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso Geral</span>
                      <span className="text-muted-foreground">{projeto.progresso}%</span>
                    </div>
                    <Progress value={projeto.progresso} className="h-3" />
                  </div>

                  {/* Informações */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {projeto.valor_total && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="font-semibold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(projeto.valor_total)}
                          </p>
                        </div>
                      </div>
                    )}

                    {projeto.data_inicio && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Início</p>
                          <p className="font-semibold">{new Date(projeto.data_inicio).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    )}

                    {projeto.data_entrega_prevista && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                          <p className="font-semibold">
                            {new Date(projeto.data_entrega_prevista).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    )}

                    {projeto.data_fim && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                          <p className="font-semibold">{new Date(projeto.data_fim).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contato */}
              {contato && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{contato.nome_empresa}</p>
                        {contato.email && <p className="text-sm text-muted-foreground truncate">{contato.email}</p>}
                        {contato.telefone && <p className="text-sm text-muted-foreground">{contato.telefone}</p>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => router.push(`/contatos/${contato.id}`)}
                    >
                      Ver Perfil do Cliente
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tarefas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tarefas</CardTitle>
                    <CardDescription>
                      {tarefas.filter((t) => t.status === "concluida").length} de {tarefas.length} concluídas
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tarefa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tarefas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma tarefa criada ainda</p>
                    <Button onClick={() => setIsTaskDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Tarefa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tarefas.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={tarefa.status === "concluida"}
                          onCheckedChange={() => handleToggleTaskStatus(tarefa)}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${tarefa.status === "concluida" ? "line-through text-muted-foreground" : ""}`}
                          >
                            {tarefa.titulo}
                          </p>
                          {tarefa.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{tarefa.descricao}</p>
                          )}
                        </div>
                        {tarefa.data_prevista && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(tarefa.data_prevista).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleTaskStatus(tarefa)}>
                              {tarefa.status === "concluida" ? "Marcar como Pendente" : "Marcar como Concluída"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(tarefa.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dialog de Edição */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Projeto</DialogTitle>
                <DialogDescription>Atualize as informações do projeto</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-nome">Nome do Projeto</Label>
                  <Input
                    id="edit-nome"
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea
                    id="edit-descricao"
                    value={editForm.descricao}
                    onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value })}
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
                    <Label htmlFor="edit-prioridade">Prioridade</Label>
                    <Select
                      value={editForm.prioridade}
                      onValueChange={(value) => setEditForm({ ...editForm, prioridade: value })}
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
                  <Label htmlFor="edit-valor">Valor Total (R$)</Label>
                  <Input
                    id="edit-valor"
                    type="number"
                    step="0.01"
                    value={editForm.valor_total}
                    onChange={(e) => setEditForm({ ...editForm, valor_total: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-data-inicio">Data de Início</Label>
                    <Input
                      id="edit-data-inicio"
                      type="date"
                      value={editForm.data_inicio}
                      onChange={(e) => setEditForm({ ...editForm, data_inicio: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-data-fim">Previsão de Término</Label>
                    <Input
                      id="edit-data-fim"
                      type="date"
                      value={editForm.data_entrega_prevista}
                      onChange={(e) => setEditForm({ ...editForm, data_entrega_prevista: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateProjeto}>Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de Nova Tarefa */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogDescription>Adicione uma nova tarefa ao projeto</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-titulo">Título da Tarefa</Label>
                  <Input
                    id="task-titulo"
                    value={taskForm.titulo}
                    onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })}
                    placeholder="Ex: Criar wireframes"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="task-descricao">Descrição</Label>
                  <Textarea
                    id="task-descricao"
                    value={taskForm.descricao}
                    onChange={(e) => setTaskForm({ ...taskForm, descricao: e.target.value })}
                    placeholder="Descreva os detalhes da tarefa..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-status">Status</Label>
                    <Select
                      value={taskForm.status}
                      onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="task-prioridade">Prioridade</Label>
                    <Select
                      value={taskForm.prioridade}
                      onValueChange={(value) => setTaskForm({ ...taskForm, prioridade: value })}
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
                  <Label htmlFor="task-data">Data Prevista</Label>
                  <Input
                    id="task-data"
                    type="date"
                    value={taskForm.data_prevista}
                    onChange={(e) => setTaskForm({ ...taskForm, data_prevista: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTask}>Criar Tarefa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
