"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Quote,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Sparkles,
  ChevronDown,
  Rocket,
  Play,
  Send,
} from "lucide-react"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function VendasPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/Logoisolado-uKCIkyg5sDoA4WPnm6wZhwU0dWiUDq.svg"
              alt="Lidzy"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#recursos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Recursos
            </Link>
            <Link href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Como Funciona
            </Link>
            <Link href="#depoimentos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Depoimentos
            </Link>
            <Link href="#planos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Planos
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <AnimatedSection>
              <div className="mb-8 flex justify-center">
                <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>A Ferramenta de Prospecção para Profissionais Autônomos</span>
                </Badge>
              </div>

              <h1 className="mb-8 text-balance text-center text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                Pare de Perder Tempo Buscando Clientes.{" "}
                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  Comece a Fechar Negócios
                </span>
              </h1>

              <p className="mx-auto mb-12 max-w-3xl text-pretty text-center text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
                Encontre clientes ideais no automático, organize tudo no WhatsApp Business e acompanhe cada oportunidade
                até o fechamento. Feito para designers, gestores de tráfego, web designers e profissionais digitais que
                querem escalar sem contratar equipe.
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group relative h-14 gap-2 overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 px-8 text-base font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:shadow-primary/50"
                  >
                    <span className="relative z-10">Começar Agora Grátis</span>
                    <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Button>
                </Link>
                <Link href="#planos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="group relative h-14 overflow-hidden border-2 border-primary/20 bg-background px-8 text-base font-semibold transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                  >
                    <span className="relative z-10">Ver Planos e Preços</span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Button>
                </Link>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                ✓ 7 dias de garantia • ✓ Cancele quando quiser • ✓ Suporte em português
              </p>
            </AnimatedSection>

            <AnimatedSection className="my-16">
              <div className="relative mx-auto max-w-5xl">
                {/* Glow effect atrás da imagem */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-75 blur-2xl" />

                <div className="relative aspect-video overflow-hidden rounded-2xl border-2 border-primary/10 bg-muted shadow-2xl ring-1 ring-primary/5">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/modern-dashboard-interface-with-leads-kanban-board-FpY6m.jpg"
                    alt="Dashboard Lidzy - Interface moderna de gestão de leads"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
                <div className="text-center">
                  <div className="mb-2 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                    10k+
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Leads Gerados</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                    98%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Taxa de Entrega</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                    45%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Aumento em Conversões</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                    24/7
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Suporte Disponível</div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl">
              <p className="mb-4 text-center text-sm font-medium italic text-primary">O Desafio</p>
              <h2 className="mb-6 text-balance text-center text-4xl font-bold md:text-5xl">
                Você Está Perdendo Dinheiro Enquanto Procura Clientes
              </h2>
              <p className="mb-12 text-pretty text-center text-lg text-muted-foreground">
                Cada hora buscando contatos em planilhas, perdendo mensagens no WhatsApp pessoal e esquecendo de fazer
                follow-up é uma hora que você não está faturando. Enquanto isso, seus concorrentes já estão na frente.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-destructive/20 bg-destructive/5 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-destructive">Sem Lidzy</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Horas perdidas buscando clientes no Google</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Leads misturados com conversas pessoais</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Esquece de fazer follow-up e perde vendas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Não sabe quantos leads tem ou onde estão</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Trabalha muito mas fatura pouco</span>
                    </li>
                  </ul>
                </Card>

                <Card className="border-primary/20 bg-primary/5 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-primary">Com Lidzy</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Clientes qualificados chegam automaticamente</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Tudo organizado em um CRM profissional</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Nunca mais perde uma oportunidade de venda</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Sabe exatamente onde cada negócio está</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Mais tempo criando, menos tempo prospectando</span>
                    </li>
                  </ul>
                </Card>
              </div>

              <div className="mt-10 text-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group relative gap-2 overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                  >
                    <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
                    <span>Começar Agora</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section - Visual */}
      <section id="recursos" className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Recursos Poderosos</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">
                Ferramentas Profissionais que Cabem no Seu Bolso
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Tudo que você precisa para trabalhar como uma agência grande, mas sem a complexidade ou o preço alto
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Feature 1 */}
            <AnimatedSection>
              <Card className="group overflow-hidden p-8 transition-all hover:shadow-lg">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Encontre Clientes no Automático</h3>
                    <p className="text-sm text-muted-foreground">Pare de gastar horas no Google</p>
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  Defina seu cliente ideal (ex: restaurantes em São Paulo, clínicas em Curitiba) e deixe nossa IA buscar
                  centenas de contatos qualificados para você. Em minutos, não em horas.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Busca por nicho, cidade e segmento</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Telefone, endereço e site validados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Exporta tudo em um clique</span>
                  </li>
                </ul>
              </Card>
            </AnimatedSection>

            {/* Feature 2 */}
            <AnimatedSection>
              <Card className="group overflow-hidden p-8 transition-all hover:shadow-lg">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">WhatsApp Profissional Organizado</h3>
                    <p className="text-sm text-muted-foreground">Separe trabalho de vida pessoal</p>
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  Chega de perder propostas no meio de mensagens da família. Gerencie todas as conversas de trabalho em
                  um só lugar, com histórico completo e sem bagunça.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Conecta seu WhatsApp Business</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Histórico completo de cada cliente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Envia mensagens personalizadas em massa</span>
                  </li>
                </ul>
              </Card>
            </AnimatedSection>

            {/* Feature 3 */}
            <AnimatedSection>
              <Card className="group overflow-hidden p-8 transition-all hover:shadow-lg">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Veja Todas as Oportunidades de Uma Vez</h3>
                    <p className="text-sm text-muted-foreground">Nunca mais esqueça de fazer follow-up</p>
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  Organize seus leads em um quadro visual tipo Trello. Arraste entre "Contato Inicial", "Proposta
                  Enviada", "Negociação" e "Fechado". Simples assim.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Quadro Kanban fácil de usar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Crie suas próprias etapas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Veja seu pipeline completo</span>
                  </li>
                </ul>
              </Card>
            </AnimatedSection>

            {/* Feature 4 */}
            <AnimatedSection>
              <Card className="group overflow-hidden p-8 transition-all hover:shadow-lg">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Saiba o Que Está Funcionando</h3>
                    <p className="text-sm text-muted-foreground">Dados claros para melhorar seus resultados</p>
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  Veja quantos leads você tem, quantos viraram clientes, qual região converte mais e quanto tempo leva
                  para fechar. Melhore o que funciona, abandone o que não funciona.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Dashboard com números importantes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Taxa de conversão em tempo real</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Gráficos simples de entender</span>
                  </li>
                </ul>
              </Card>
            </AnimatedSection>
          </div>

          <AnimatedSection>
            <div className="mt-12 text-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="group gap-2 border-2 border-primary/20 bg-background font-semibold transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                >
                  <Play className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>Ver Recursos em Ação</span>
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-y bg-gradient-to-b from-muted/30 to-background py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Plataforma Completa</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">
                Todas as Ferramentas que Você Precisa em Um Só Lugar
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Do primeiro contato até o fechamento do projeto. Gerencie todo o ciclo de vendas sem precisar de 10
                ferramentas diferentes.
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* CRM Completo */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">CRM Completo</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Cadastre e organize todos os seus contatos com informações detalhadas: empresa, telefone, email,
                    endereço, website, nicho e região. Tudo em um só lugar.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Gestão de Projetos */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Gestão de Projetos</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Crie e acompanhe projetos para cada cliente. Defina valor, prazo, status e descrição. Veja todos os
                    projetos ativos, concluídos ou em andamento de forma organizada.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Sistema de Tags */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Sistema de Etiquetas</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Crie etiquetas personalizadas com cores para categorizar seus contatos. Filtre por etiquetas e
                    encontre rapidamente grupos específicos de clientes.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Rastreamento de Origem */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Rastreamento de Origem</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Saiba de onde cada lead veio: scraping automático, importação manual, agente IA, API ou WhatsApp.
                    Identifique quais canais trazem os melhores clientes.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Funil de Vendas Visual */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Funil de Vendas Visual</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Quadro Kanban intuitivo para mover leads entre etapas: Novo, Contato Inicial, Proposta Enviada,
                    Negociação, Fechado ou Perdido. Arraste e solte com facilidade.
                  </p>
                </Card>
              </AnimatedSection>

              {/* WhatsApp Integrado */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">WhatsApp Integrado</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Conecte seu WhatsApp Business e gerencie todas as conversas na plataforma. Envie mensagens
                    individuais ou em massa, veja histórico completo e nunca perca uma mensagem.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Dashboard Analytics */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Dashboard Analytics</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Visualize métricas importantes: total de leads, taxa de conversão, leads por região, leads por
                    nicho, evolução mensal e muito mais. Gráficos claros e fáceis de entender.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Relatórios e Exportação */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Relatórios e Exportação</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Exporte seus contatos, projetos e relatórios em CSV ou Excel. Integre com outras ferramentas ou
                    mantenha backup dos seus dados sempre atualizado.
                  </p>
                </Card>
              </AnimatedSection>

              {/* Busca e Filtros Avançados */}
              <AnimatedSection>
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Busca e Filtros Avançados</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Encontre qualquer contato em segundos. Filtre por status, nicho, região, etiquetas ou origem.
                    Combine múltiplos filtros para segmentações precisas.
                  </p>
                </Card>
              </AnimatedSection>
            </div>

            <AnimatedSection>
              <div className="mt-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
                <h3 className="mb-4 text-2xl font-bold">Tudo Isso em Uma Única Plataforma</h3>
                <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
                  Não precisa mais pagar por 5 ferramentas diferentes, aprender 5 interfaces diferentes ou perder tempo
                  integrando tudo. O Lidzy é completo, simples e acessível.
                </p>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group relative gap-2 overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                  >
                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span>Experimentar Todas as Ferramentas Grátis</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How it Works - Detailed */}
      <section id="como-funciona" className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Processo Simples</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">
                De Zero a Leads Qualificados em Minutos
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Nossa plataforma foi projetada para ser intuitiva. Você não precisa ser expert em tecnologia para gerar
                resultados.
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto max-w-4xl space-y-12">
            {/* Step 1 */}
            <AnimatedSection>
              <div className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">Defina seu Público-Alvo</h3>
                  <p className="mb-4 text-muted-foreground">
                    Escolha o nicho (ex: restaurantes, clínicas, e-commerces), região (cidade, estado ou país) e outros
                    critérios específicos do seu negócio. Nossa IA entende exatamente o que você precisa.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Nicho</Badge>
                    <Badge variant="secondary">Região</Badge>
                    <Badge variant="secondary">Porte da Empresa</Badge>
                    <Badge variant="secondary">Segmento</Badge>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 2 */}
            <AnimatedSection>
              <div className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">Gere Leads Automaticamente</h3>
                  <p className="mb-4 text-muted-foreground">
                    Com um clique, nossa plataforma busca, valida e organiza centenas de contatos qualificados. Você
                    recebe nome da empresa, telefone, endereço, website e outras informações relevantes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Busca Automática</Badge>
                    <Badge variant="secondary">Validação de Dados</Badge>
                    <Badge variant="secondary">Organização Inteligente</Badge>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 3 */}
            <AnimatedSection>
              <div className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">Conecte via WhatsApp</h3>
                  <p className="mb-4 text-muted-foreground">
                    Envie mensagens personalizadas diretamente pelo WhatsApp Business integrado. Acompanhe todas as
                    conversas em um só lugar e nunca perca o timing de uma resposta.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Mensagens Personalizadas</Badge>
                    <Badge variant="secondary">Envio em Massa</Badge>
                    <Badge variant="secondary">Histórico Completo</Badge>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 4 */}
            <AnimatedSection>
              <div className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">Acompanhe e Converta</h3>
                  <p className="mb-4 text-muted-foreground">
                    Use o Kanban visual para mover leads pelo funil de vendas. Acompanhe métricas, identifique gargalos
                    e otimize seu processo até fechar mais negócios.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Kanban Visual</Badge>
                    <Badge variant="secondary">Métricas em Tempo Real</Badge>
                    <Badge variant="secondary">Otimização Contínua</Badge>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Casos de Uso</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">Feito para Profissionais Como Você</h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Seja você freelancer, autônomo ou pequena agência, o Lidzy foi feito para quem trabalha sozinho ou com
                equipe enxuta
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Designers & Web Designers</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre empresas que precisam de logo, identidade visual, site ou redesign. Preencha sua agenda com
                  projetos qualificados e pare de depender de indicação.
                </p>
              </Card>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Gestores de Tráfego</h3>
                <p className="text-sm text-muted-foreground">
                  Prospecte e-commerces, infoprodutores e empresas locais que precisam de anúncios. Encontre clientes
                  com orçamento e dispostos a investir em tráfego pago.
                </p>
              </Card>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Agências Digitais</h3>
                <p className="text-sm text-muted-foreground">
                  Escale sua prospecção sem contratar SDR. Encontre clientes para social media, branding, SEO e
                  performance. Mantenha seu pipeline sempre cheio.
                </p>
              </Card>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Desenvolvedores</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre empresas que precisam de site, landing page, e-commerce ou sistema customizado. Automatize a
                  prospecção e foque no que você ama: programar.
                </p>
              </Card>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Consultores & Mentores</h3>
                <p className="text-sm text-muted-foreground">
                  Prospecte empresas que precisam de consultoria em vendas, marketing, gestão ou transformação digital.
                  Leads qualificados para serviços de alto valor.
                </p>
              </Card>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Social Media & Copywriters</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre empresas que precisam de gestão de redes sociais, criação de conteúdo ou copy para vendas.
                  Contratos recorrentes que garantem renda previsível.
                </p>
              </Card>
            </AnimatedSection>
          </div>

          <AnimatedSection>
            <div className="mt-12 text-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group relative gap-2 overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                >
                  <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  <span>Comece Sua Jornada Agora</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Depoimentos Reais</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">
                Empresas e Profissionais que Confiam no Lidzy
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Veja como estamos ajudando negócios a crescerem com geração inteligente de leads
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="mx-auto w-full max-w-6xl"
            >
              <CarouselContent>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "O Lidzy revolucionou nossa prospecção. Em 2 meses geramos mais de 300 leads qualificados e
                      fechamos 15 novos contratos. O ROI foi absurdo!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        MC
                      </div>
                      <div>
                        <p className="font-semibold">Mariana Costa</p>
                        <p className="text-xs text-muted-foreground">CEO, Agência Digital Pro</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>

                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "Como gestor de tráfego autônomo, o Lidzy me ajudou a encontrar clientes ideais. Minha carteira
                      cresceu 200% em 3 meses. Não consigo mais trabalhar sem!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        RS
                      </div>
                      <div>
                        <p className="font-semibold">Rafael Santos</p>
                        <p className="text-xs text-muted-foreground">Gestor de Tráfego Freelancer</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>

                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "A integração com WhatsApp é perfeita. Consigo gerenciar todas as conversas em um só lugar e não
                      perco nenhuma oportunidade. Minha taxa de conversão subiu 45%."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        JO
                      </div>
                      <div>
                        <p className="font-semibold">João Oliveira</p>
                        <p className="text-xs text-muted-foreground">Designer Freelancer</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>

                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "Antes gastávamos horas buscando leads manualmente. Com o Lidzy, automatizamos tudo e focamos no
                      que importa: fechar vendas. Produtividade nas alturas!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        AS
                      </div>
                      <div>
                        <p className="font-semibold">Ana Silva</p>
                        <p className="text-xs text-muted-foreground">Diretora Comercial, TechSolutions</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>

                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "O sistema de créditos é justo e transparente. Pago apenas pelo que uso e os resultados compensam
                      muito o investimento. Melhor custo-benefício do mercado."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        PC
                      </div>
                      <div>
                        <p className="font-semibold">Pedro Carvalho</p>
                        <p className="text-xs text-muted-foreground">Consultor de Marketing B2B</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>

                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                      "O Kanban visual me ajuda a acompanhar cada lead no funil. Aumentamos nossa taxa de conversão em
                      45% desde que começamos a usar. Ferramenta indispensável!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        LM
                      </div>
                      <div>
                        <p className="font-semibold">Luciana Mendes</p>
                        <p className="text-xs text-muted-foreground">Fundadora, Growth Hub</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </AnimatedSection>
        </div>
      </section>

      {/* Comparison/Differentials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Por que Lidzy</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">Simples, Profissional e Acessível</h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Não é um CRM complicado que você nunca vai usar. É uma ferramenta feita para quem trabalha sozinho e
                precisa de resultados rápidos.
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Economize 10+ Horas por Semana</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O que levava um dia inteiro de busca manual agora leva 5 minutos. Use esse tempo para criar, atender
                    clientes ou simplesmente descansar. Você merece.
                  </p>
                </Card>
              </AnimatedSection>

              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Leads Reais, Não Lixo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Todos os contatos são validados automaticamente. Telefones que funcionam, empresas que existem,
                    informações atualizadas. Sem perder tempo com dados falsos.
                  </p>
                </Card>
              </AnimatedSection>

              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Fácil de Usar (Sério Mesmo)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se você sabe usar WhatsApp, você sabe usar o Lidzy. Interface simples, sem complicação. Não precisa
                    ser expert em tecnologia ou fazer curso para começar.
                  </p>
                </Card>
              </AnimatedSection>

              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Números que Fazem Sentido</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nada de métricas complicadas que você não entende. Veja o que importa: quantos leads você tem,
                    quantos viraram clientes, quanto tempo leva para fechar.
                  </p>
                </Card>
              </AnimatedSection>

              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Suporte em Português (de Verdade)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Time brasileiro que responde rápido e resolve seu problema. Não é chatbot, não é gringo que não
                    entende sua realidade. São pessoas reais que querem te ajudar.
                  </p>
                </Card>
              </AnimatedSection>

              <AnimatedSection>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Preço Justo para Freelancer</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Não é R$ 5.000/mês como outros CRMs. É um preço que cabe no bolso de quem trabalha sozinho. Você
                    paga pelo que usa, sem taxas escondidas ou surpresas.
                  </p>
                </Card>
              </AnimatedSection>
            </div>
          </div>

          <AnimatedSection>
            <div className="mt-12 text-center">
              <Link href="#planos">
                <Button
                  size="lg"
                  variant="outline"
                  className="group gap-2 border-2 border-primary/20 bg-background font-semibold transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                >
                  <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-[-2px]" />
                  <span>Escolher Meu Plano</span>
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Planos Transparentes</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">Escolha o Plano Ideal para Você</h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Comece pequeno e escale conforme seu negócio cresce. Todos os planos incluem 7 dias de garantia.
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {/* Starter */}
            <Card className="flex flex-col p-8">
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">Starter</h3>
                <p className="text-sm text-muted-foreground">Para quem está começando</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$ 97</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">ou R$ 970/ano (economize 17%)</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>500 créditos/mês</strong> (leads + mensagens)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">1 instância WhatsApp Business</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">CRM completo com Kanban</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">Analytics básico</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">Suporte por email</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">7 dias de garantia</span>
                </li>
              </ul>
              <Link href="/signup" className="w-full">
                <Button
                  variant="outline"
                  className="group w-full border-2 border-primary/20 bg-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                >
                  <span>Começar Agora</span>
                </Button>
              </Link>
            </Card>

            {/* Professional - Destaque */}
            <Card className="relative flex flex-col border-primary p-8 shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Mais Popular</Badge>
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">Professional</h3>
                <p className="text-sm text-muted-foreground">Para profissionais sérios</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$ 197</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">ou R$ 1.970/ano (economize 17%)</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>2.000 créditos/mês</strong> (leads + mensagens)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">3 instâncias WhatsApp Business</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">CRM completo com Kanban</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>Analytics avançado</strong> com relatórios
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>Suporte prioritário</strong> (resposta em 2h)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">Exportação de dados</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">7 dias de garantia</span>
                </li>
              </ul>
              <Link href="/signup" className="w-full">
                <Button className="group relative w-full overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40">
                  <span className="relative z-10">Começar Agora</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </Link>
            </Card>

            {/* Enterprise */}
            <Card className="flex flex-col p-8">
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">Enterprise</h3>
                <p className="text-sm text-muted-foreground">Para empresas em crescimento</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$ 497</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">ou R$ 4.970/ano (economize 17%)</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>10.000 créditos/mês</strong> (leads + mensagens)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>Instâncias ilimitadas</strong> WhatsApp
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">CRM completo com Kanban</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">Analytics avançado + BI personalizado</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>Suporte 24/7</strong> com gerente dedicado
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>API dedicada</strong> para integrações
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">Treinamento e onboarding incluso</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">7 dias de garantia</span>
                </li>
              </ul>
              <Link href="/signup" className="w-full">
                <Button
                  variant="outline"
                  className="group w-full border-2 border-primary/20 bg-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                >
                  <span>Começar Agora</span>
                </Button>
              </Link>
            </Card>
          </div>

          <p className="mt-12 text-center text-sm text-muted-foreground">
            Todos os planos incluem atualizações gratuitas e acesso a novos recursos. Pagamento seguro via Asaas.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium italic text-primary">Perguntas Frequentes</p>
              <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">Dúvidas? Temos as Respostas</h2>
              <p className="text-pretty text-lg text-muted-foreground">Tudo que você precisa saber antes de começar</p>
            </div>
          </AnimatedSection>

          <div className="mx-auto max-w-3xl space-y-4">
            {[
              {
                q: "Como funciona o sistema de créditos?",
                a: "Cada lead gerado consome 1 crédito. Cada mensagem enviada via WhatsApp também consome 1 crédito. Você compra créditos através dos planos mensais e usa conforme sua necessidade. Créditos não utilizados acumulam para o próximo mês.",
              },
              {
                q: "Posso cancelar minha assinatura a qualquer momento?",
                a: "Sim! Não há fidelidade. Você pode cancelar quando quiser e continua tendo acesso até o final do período pago. Seus dados ficam salvos caso queira voltar no futuro.",
              },
              {
                q: "Os leads são exclusivos ou compartilhados?",
                a: "Os leads não são exclusivos. Vários usuários podem buscar e encontrar as mesmas empresas, já que são dados públicos. O diferencial está em como você aborda e converte esses contatos.",
              },
              {
                q: "Preciso ter conhecimento técnico para usar?",
                a: "Não! A plataforma foi projetada para ser intuitiva. Se você sabe usar WhatsApp e navegar na internet, consegue usar o Lidzy. Além disso, oferecemos tutoriais e suporte para ajudar.",
              },
              {
                q: "Como funciona a integração com WhatsApp?",
                a: "Você conecta sua conta WhatsApp Business através de um QR Code (igual ao WhatsApp Web). A partir daí, todas as conversas ficam sincronizadas na plataforma e você pode gerenciar tudo em um só lugar.",
              },
              {
                q: "Posso usar em múltiplos dispositivos?",
                a: "Sim! Você pode acessar sua conta de qualquer dispositivo (computador, tablet, celular). Tudo fica sincronizado na nuvem.",
              },
              {
                q: "Há garantia de resultados?",
                a: "Garantimos que você terá acesso a leads qualificados e ferramentas profissionais. Os resultados de vendas dependem da sua abordagem e follow-up. Mas oferecemos 7 dias de garantia: se não gostar, devolvemos seu dinheiro.",
              },
              {
                q: "Posso fazer upgrade ou downgrade do plano?",
                a: "Sim! Você pode mudar de plano a qualquer momento. No upgrade, você paga a diferença proporcional. No downgrade, o ajuste é feito na próxima cobrança.",
              },
            ].map((faq, i) => (
              <AnimatedSection key={i}>
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="font-semibold">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="border-t px-6 pb-6 pt-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </Card>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="mt-12 text-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group relative gap-2 overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                >
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>Ainda Tem Dúvidas? Fale Conosco</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Final - Strong */}
      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="container relative mx-auto px-4 text-center">
          <AnimatedSection>
            <p className="mb-4 text-sm font-medium italic opacity-90">Comece Hoje Mesmo</p>
            <h2 className="mb-6 text-balance text-4xl font-bold md:text-5xl">
              Pare de Procurar Clientes. Deixe Eles Chegarem Até Você
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg opacity-90">
              Junte-se a centenas de designers, gestores de tráfego e profissionais digitais que já estão preenchendo
              suas agendas e faturando mais com o Lidzy.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group relative h-14 gap-2 overflow-hidden bg-secondary px-8 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <span className="relative z-10">Começar Agora Grátis</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-white/10 to-secondary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </Link>
              <Link href="#planos">
                <Button
                  size="lg"
                  variant="outline"
                  className="group h-14 border-2 border-primary-foreground/30 bg-transparent px-8 font-semibold text-primary-foreground transition-all duration-300 hover:scale-105 hover:border-primary-foreground/50 hover:bg-primary-foreground/10 hover:shadow-lg"
                >
                  <span>Ver Planos</span>
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm opacity-75">7 dias de garantia • Cancele quando quiser • Sem burocracia</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer - Complete */}
      <footer className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/Logoisolado-uKCIkyg5sDoA4WPnm6wZhwU0dWiUDq.svg"
                  alt="Lidzy"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Plataforma completa de geração inteligente de leads B2B via WhatsApp. Automatize sua prospecção e foque
                em fechar vendas.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Produto */}
            <div>
              <h4 className="mb-4 font-semibold">Produto</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#recursos" className="hover:text-foreground">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#planos" className="hover:text-foreground">
                    Planos e Preços
                  </Link>
                </li>
                <li>
                  <Link href="#depoimentos" className="hover:text-foreground">
                    Depoimentos
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Casos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="mb-4 font-semibold">Empresa</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    Política de Cookies
                  </Link>
                </li>
                <li>
                  <Link href="/vendas" className="hover:text-foreground">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
              <p>© 2025 Lidzy. Todos os direitos reservados.</p>
              <p>Feito com ❤️ no Brasil</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
