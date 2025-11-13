"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Gift,
  Users,
  Check,
  Mail,
  Share2,
  QrCode,
  TrendingUp,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type ReferralData = {
  codigo_referencia: string
  stats: {
    total: number
    completed: number
    pending: number
    totalCreditsEarned: number
  }
  referrals: Array<{
    id: string
    referred_email: string
    status: string
    creditos_bonus: number
    created_at: string
    completed_at?: string
    usuarios?: {
      nome: string
      email: string
    }
  }>
}

export default function IndicacoesPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)

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
  }, [router, supabase])

  useEffect(() => {
    if (!authLoading) {
      fetchReferrals()
    }
  }, [authLoading])

  const fetchReferrals = async () => {
    try {
      const response = await fetch("/api/referrals")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching referrals:", error)
      toast.error("Erro ao carregar indicações")
    } finally {
      setLoading(false)
    }
  }

  const copiarLink = () => {
    const link = `${window.location.origin}/cadastro?ref=${data?.codigo_referencia}`
    navigator.clipboard.writeText(link)
    toast.success("Link copiado para a área de transferência!")
  }

  const copiarCodigo = () => {
    navigator.clipboard.writeText(data?.codigo_referencia || "")
    toast.success("Código copiado!")
  }

  const convidarPorEmail = async () => {
    if (!email) {
      toast.error("Digite um email")
      return
    }

    setInviting(true)
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Convite enviado com sucesso!")
        setEmail("")
        fetchReferrals() // Refresh list
      } else {
        toast.error(result.error || "Erro ao enviar convite")
      }
    } catch (error) {
      console.error("Error inviting:", error)
      toast.error("Erro ao enviar convite")
    } finally {
      setInviting(false)
    }
  }

  const compartilharWhatsApp = () => {
    const link = `${window.location.origin}/cadastro?ref=${data?.codigo_referencia}`
    const texto = `Olá! Você foi convidado para usar o Lidzy - a melhor plataforma de automação de prospecção! 🚀\n\nCadastre-se usando meu link e ganhe 300 créditos de bônus:\n${link}`
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, "_blank")
  }

  const compartilharEmail = () => {
    const link = `${window.location.origin}/cadastro?ref=${data?.codigo_referencia}`
    const assunto = "Convite para Lidzy - Ganhe 300 créditos!"
    const corpo = `Olá!\n\nVocê foi convidado para usar o Lidzy - a melhor plataforma de automação de prospecção!\n\nCadastre-se usando meu link de indicação e ganhe 300 créditos de bônus:\n${link}\n\nAté logo!`
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rewarded":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Bônus Recebido
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Ativação
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline">
            <Send className="h-3 w-3 mr-1" />
            Convite Enviado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Indique e Ganhe" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Gift className="h-8 w-8 text-primary" />
                Indique e Ganhe
              </h1>
              <p className="text-muted-foreground mt-2">
                Convide seus amigos e ganhe <span className="font-bold text-primary">500 créditos</span> para cada amigo
                que se cadastrar e usar a plataforma. Seu amigo também ganha{" "}
                <span className="font-bold text-primary">300 créditos</span>!
              </p>
            </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Ganhos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.totalCreditsEarned || 0}</div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amigos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Já usando a plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{data?.stats.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando cadastro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Indicações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os convites</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="compartilhar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compartilhar">Compartilhar</TabsTrigger>
          <TabsTrigger value="indicacoes">Minhas Indicações</TabsTrigger>
          <TabsTrigger value="regras">Como Funciona</TabsTrigger>
        </TabsList>

        <TabsContent value="compartilhar" className="space-y-4">
          {/* Link de Indicação */}
          <Card>
            <CardHeader>
              <CardTitle>Seu Link de Indicação</CardTitle>
              <CardDescription>Compartilhe este link com seus amigos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/cadastro?ref=${data?.codigo_referencia || ""}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copiarLink} size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Código de Indicação</Label>
                <div className="flex gap-2">
                  <Input
                    value={data?.codigo_referencia || ""}
                    readOnly
                    className="font-mono text-lg font-bold text-center tracking-wider"
                  />
                  <Button onClick={copiarCodigo} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Botões de Compartilhamento */}
              <div className="space-y-2">
                <Label>Compartilhar via:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={compartilharWhatsApp} variant="outline" className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button onClick={compartilharEmail} variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Convidar por Email */}
          <Card>
            <CardHeader>
              <CardTitle>Convidar por Email</CardTitle>
              <CardDescription>Digite o email do seu amigo para enviar um convite</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="amigo@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && convidarPorEmail()}
                />
                <Button onClick={convidarPorEmail} disabled={inviting}>
                  {inviting ? "Enviando..." : "Convidar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suas Indicações</CardTitle>
              <CardDescription>Acompanhe o status dos seus convites</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.referrals && data.referrals.length > 0 ? (
                <div className="space-y-3">
                  {data.referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ref.usuarios?.nome || ref.referred_email}</p>
                          {getStatusBadge(ref.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Convidado em {new Date(ref.created_at).toLocaleDateString("pt-BR")}
                          {ref.completed_at && (
                            <> • Ativado em {new Date(ref.completed_at).toLocaleDateString("pt-BR")}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-600">
                          {ref.creditos_bonus > 0 ? `+${ref.creditos_bonus}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">créditos</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Você ainda não indicou ninguém</p>
                  <p className="text-sm text-muted-foreground mt-2">Comece compartilhando seu link!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona o Programa de Indicações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Compartilhe seu link</h3>
                    <p className="text-sm text-muted-foreground">
                      Envie seu link de indicação ou código para amigos, colegas e conhecidos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Seu amigo se cadastra</h3>
                    <p className="text-sm text-muted-foreground">
                      Quando seu amigo criar uma conta usando seu link ou código de indicação.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Amigo ativa a conta</h3>
                    <p className="text-sm text-muted-foreground">
                      Quando seu amigo comprar créditos ou assinar um plano pela primeira vez.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Vocês dois ganham créditos!</h3>
                    <p className="text-sm text-muted-foreground mb-2">Os bônus são aplicados automaticamente:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          <strong className="text-foreground">Você ganha:</strong> 500 créditos bônus
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          <strong className="text-foreground">Seu amigo ganha:</strong> 300 créditos bônus
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Benefícios
                </h3>
                <ul className="text-sm space-y-1 ml-7">
                  <li>✅ Sem limite de indicações</li>
                  <li>✅ Créditos válidos por tempo indeterminado</li>
                  <li>✅ Bônus aplicado automaticamente</li>
                  <li>✅ Acompanhe todas as indicações em tempo real</li>
                </ul>
              </div>
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
