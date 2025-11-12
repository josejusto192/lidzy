"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  MessageCircle,
  Edit,
  FolderKanban,
  Tag,
  ExternalLink,
} from "lucide-react"
import { STATUS_CONFIG } from "@/lib/status-config"
import { ContactTagsManager } from "@/components/contact-tags-manager"
import { ContactOriginSelector } from "@/components/contact-origin-selector"

interface Contato {
  id: string
  nome_empresa: string
  telefone: string
  email?: string
  cnpj?: string
  endereco?: string
  website?: string
  status: string
  nicho?: string
  regiao?: string
  valor?: number
  origem?: string
  criado_em: string
  data_contato?: string
  photo?: string
  tags?: Array<{ id: string; nome: string; cor: string }>
}

interface Projeto {
  id: string
  nome: string
  descricao?: string
  status: string
  prioridade: string
  valor_total?: number
  progresso: number
  data_inicio?: string
  data_fim?: string
  data_entrega_prevista?: string
  created_at: string
  funcao?: string
}

export default function ContatoPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [contato, setContato] = useState<Contato | null>(null)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContatoDetalhes()
  }, [params.id])

  const fetchContatoDetalhes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contatos/${params.id}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar contato")
      }

      const data = await response.json()
      setContato(data.contato)
      setProjetos(data.projetos || [])
    } catch (error) {
      console.error("[v0] Erro ao buscar contato:", error)
      toast.error("Erro ao carregar perfil do cliente")
    } finally {
      setLoading(false)
    }
  }

  const abrirWhatsApp = () => {
    if (!contato?.telefone) {
      toast.error("Telefone não disponível")
      return
    }

    // Remover caracteres não numéricos
    const telefoneNumerico = contato.telefone.replace(/\D/g, "")
    const url = `https://wa.me/${telefoneNumerico}`
    window.open(url, "_blank")
  }

  const formatarValor = (valor?: number) => {
    if (!valor) return "Não informado"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const formatarData = (data?: string) => {
    if (!data) return "Não informado"
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    if (!config) return <Badge variant="secondary">{status}</Badge>

    return <Badge className={`${config.bgClass} text-white`}>{config.label}</Badge>
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const cores = {
      baixa: "bg-gray-500",
      media: "bg-blue-500",
      alta: "bg-orange-500",
      urgente: "bg-red-500",
    }

    return (
      <Badge className={`${cores[prioridade as keyof typeof cores] || "bg-gray-500"} text-white`}>
        {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
          <Header title="Perfil do Cliente" />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!contato) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
          <Header title="Perfil do Cliente" />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-muted-foreground">Cliente não encontrado</p>
              <Button onClick={() => router.push("/contatos")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Contatos
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Perfil do Cliente" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header com ações */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push("/contatos")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={abrirWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Abrir WhatsApp
                </Button>
                <Button onClick={() => router.push(`/contatos/${contato.id}/editar`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Informações principais */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={contato.photo || undefined} alt={contato.nome_empresa} />
                      <AvatarFallback className="text-2xl">
                        {contato.nome_empresa.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">{contato.nome_empresa}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contato.status)}
                        {contato.nicho && <Badge variant="outline">{contato.nicho}</Badge>}
                        {contato.regiao && <Badge variant="outline">{contato.regiao}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor do Negócio</p>
                    <p className="text-2xl font-bold text-green-600">{formatarValor(contato.valor)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações de contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{contato.telefone}</p>
                    </div>
                  </div>

                  {contato.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{contato.email}</p>
                      </div>
                    </div>
                  )}

                  {contato.cnpj && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ</p>
                        <p className="font-medium">{contato.cnpj}</p>
                      </div>
                    </div>
                  )}

                  {contato.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a
                          href={contato.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {contato.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {contato.endereco && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">{contato.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Datas e origem */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <p className="font-medium">{formatarData(contato.criado_em)}</p>
                    </div>
                  </div>

                  {contato.data_contato && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Primeiro Contato</p>
                        <p className="font-medium">{formatarData(contato.data_contato)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Origem</p>
                    <ContactOriginSelector
                      contactId={contato.id}
                      currentOrigin={contato.origem}
                      onOriginChange={fetchContatoDetalhes}
                    />
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium">Etiquetas</p>
                  </div>
                  <ContactTagsManager
                    contatoId={contato.id}
                    currentTags={contato.tags || []}
                    onTagsChange={fetchContatoDetalhes}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Projetos vinculados */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5" />
                      Projetos Vinculados
                    </CardTitle>
                    <CardDescription>
                      {projetos.length === 0
                        ? "Nenhum projeto vinculado a este cliente"
                        : `${projetos.length} projeto(s) vinculado(s)`}
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push("/projetos")}>Novo Projeto</Button>
                </div>
              </CardHeader>
              <CardContent>
                {projetos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum projeto vinculado ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projetos.map((projeto) => (
                      <Card
                        key={projeto.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/projetos/${projeto.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{projeto.nome}</CardTitle>
                            {getPrioridadeBadge(projeto.prioridade)}
                          </div>
                          {projeto.descricao && (
                            <CardDescription className="line-clamp-2">{projeto.descricao}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline">{projeto.status}</Badge>
                          </div>

                          {projeto.funcao && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Função:</span>
                              <Badge variant="secondary">{projeto.funcao}</Badge>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso:</span>
                            <span className="font-medium">{projeto.progresso}%</span>
                          </div>

                          {projeto.valor_total && projeto.valor_total > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Valor:</span>
                              <span className="font-medium text-green-600">{formatarValor(projeto.valor_total)}</span>
                            </div>
                          )}

                          {projeto.data_entrega_prevista && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Entrega prevista:</span>
                              <span className="font-medium">{formatarData(projeto.data_entrega_prevista)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
