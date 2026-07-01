"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, MessageCircle, TrendingDown, History, Check, Zap } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"

const WHATSAPP_URL = "https://wa.me/5515991485349"

interface Plano {
  id: string
  nome: string
  descricao: string
  creditos_mensais: number
  preco_mensal: number
  preco_anual: number
  features: string[]
}

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

function buildWhatsAppMessage(creditos: number) {
  const text = encodeURIComponent(
    `Olá! Sou usuário da Lidzy e gostaria de solicitar mais créditos.\n\nMeu saldo atual: ${creditos} créditos.`
  )
  return `${WHATSAPP_URL}?text=${text}`
}

export default function CreditosPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [authLoading, setAuthLoading] = useState(true)
  const [data, setData] = useState<CreditosData | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/login")
      else setAuthLoading(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authLoading) fetchCreditos()
  }, [authLoading])

  const fetchCreditos = async () => {
    try {
      const [creditosRes, planosRes] = await Promise.all([
        fetch("/api/creditos"),
        fetch("/api/planos"),
      ])
      if (creditosRes.ok) setData(await creditosRes.json())
      if (planosRes.ok) {
        const p = await planosRes.json()
        setPlanos(p.planos ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const creditos = data?.creditos ?? 0
  const creditosBonus = data?.creditos_bonus ?? 0
  const totalCreditos = creditos + creditosBonus

  const tipoLabel: Record<string, string> = {
    uso_lead: "Leads gerados",
    uso_mensagem: "Mensagens enviadas",
    compra: "Compra de créditos",
    bonus_indicacao: "Bônus de indicação",
    bonus_indicado: "Bônus por indicação",
    recarga_manual: "Recarga manual",
    assinatura: "Créditos do plano",
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Coins className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* Saldo atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Seus Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-6xl font-bold text-foreground">{totalCreditos.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">créditos disponíveis</span>
                  {creditosBonus > 0 && (
                    <span className="text-xs text-yellow-500">
                      inclui {creditosBonus} de bônus
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-muted-foreground">Leads gerados</p>
                    <p className="text-xl font-semibold">{(data?.creditos_leads_usados ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-muted-foreground">Mensagens enviadas</p>
                    <p className="text-xl font-semibold">{(data?.creditos_mensagens_usados ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planos */}
            {planos.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Planos disponíveis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {planos.map((plano, i) => {
                    const destaque = i === 1
                    const msg = encodeURIComponent(
                      `Olá! Gostaria de assinar o plano ${plano.nome} da Lidzy (R$ ${plano.preco_mensal.toFixed(2).replace(".", ",")}/mês — ${plano.creditos_mensais.toLocaleString("pt-BR")} créditos). Pode me ajudar?`
                    )
                    return (
                      <div key={plano.id} className={`relative rounded-xl border p-5 flex flex-col gap-3 ${destaque ? "border-green-500 bg-green-500/5 shadow-md" : "border-border bg-card"}`}>
                        {destaque && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            Mais popular
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-base">{plano.nome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{plano.descricao}</p>
                        </div>
                        <div>
                          <span className="text-3xl font-extrabold">R$ {plano.preco_mensal.toFixed(2).replace(".", ",")}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                          {plano.preco_anual && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ou R$ {plano.preco_anual.toFixed(2).replace(".", ",")} /ano (2 meses grátis)
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-green-600">
                          {plano.creditos_mensais.toLocaleString("pt-BR")} créditos/mês
                        </p>
                        <ul className="space-y-1.5 flex-1">
                          {plano.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <a
                          href={`${WHATSAPP_URL}?text=${msg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${destaque ? "bg-green-600 hover:bg-green-700 text-white" : "border border-border bg-secondary hover:bg-secondary/80 text-foreground"}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Assinar via WhatsApp
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Solicitar créditos */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Solicitar Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Durante o período de testes, os créditos são adicionados manualmente.
                  Entre em contato via WhatsApp para solicitar uma recarga.
                </p>
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <a href={buildWhatsAppMessage(totalCreditos)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Solicitar créditos via WhatsApp
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Atendimento rápido — resposta em até algumas horas
                </p>
              </CardContent>
            </Card>

            {/* Histórico */}
            {data?.historico && data.historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Histórico de Uso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.historico.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            {item.descricao || tipoLabel[item.tipo] || item.tipo}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={item.quantidade >= 0 ? "text-green-500" : "text-red-500"}>
                              {item.quantidade >= 0 ? "+" : ""}{item.quantidade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {item.saldo_novo}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {data?.historico?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <TrendingDown className="h-8 w-8" />
                <p className="text-sm">Nenhum uso de créditos ainda.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
