"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Building2, Search, Coins, ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react"

const STEPS = [
  {
    icon: <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100"><Coins className="h-8 w-8 text-green-600" /></div>,
    title: "Bem-vindo ao Lidzy! 🎉",
    description: "O Lidzy é sua plataforma de geração de leads B2B. Você pode encontrar empresas para prospectar usando duas fontes de dados poderosas.",
    detail: "Cada lead salvo consome 1 crédito. Você pode visualizar resultados antes de gastar qualquer crédito.",
  },
  {
    icon: <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100"><MapPin className="h-8 w-8 text-red-500" /></div>,
    title: "Google Maps",
    description: "Encontre empresas locais pelo nome do segmento e região. Ideal para prospectar por nicho e localização.",
    detail: (
      <ul className="space-y-2 text-sm text-muted-foreground text-left">
        <li className="flex gap-2"><span className="text-green-500 font-bold">1.</span> Digite o nicho (ex: <em>Clínicas Odontológicas</em>)</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">2.</span> Digite a região (ex: <em>São Paulo, SP</em>)</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">3.</span> Clique em <strong>Gerar Leads</strong> — os resultados aparecem antes de gastar créditos</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">4.</span> Selecione quais salvar na sua lista</li>
      </ul>
    ),
  },
  {
    icon: <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100"><Building2 className="h-8 w-8 text-blue-600" /></div>,
    title: "Receita Federal (CNPJ)",
    description: "Busque empresas diretamente na base da Receita Federal. Mais de 50 milhões de CNPJs com dados completos.",
    detail: (
      <ul className="space-y-2 text-sm text-muted-foreground text-left">
        <li className="flex gap-2"><span className="text-green-500 font-bold">1.</span> Filtre por <strong>CNAE</strong> (atividade econômica), <strong>município</strong>, <strong>UF</strong> e <strong>porte</strong></li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">2.</span> Adicione filtros extras como <em>com email</em>, <em>com telefone</em>, <em>excluir MEI</em></li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">3.</span> Clique em <strong>Buscar</strong> — veja os resultados gratuitamente</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">4.</span> Salve individualmente ou em lote — créditos só são descontados ao salvar</li>
      </ul>
    ),
  },
  {
    icon: <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100"><Search className="h-8 w-8 text-purple-600" /></div>,
    title: "Gerenciando seus leads",
    description: "Após salvar os leads, organize-os, acompanhe o status e inicie conversas via WhatsApp com IA.",
    detail: (
      <ul className="space-y-2 text-sm text-muted-foreground text-left">
        <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> Use o <strong>Kanban</strong> para gerenciar o funil de vendas</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> Clique em qualquer lead para ver todos os dados disponíveis</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> Use os <strong>Agentes de IA</strong> para automatizar mensagens no WhatsApp</li>
        <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> Exporte seus leads em CSV quando quiser</li>
      </ul>
    ),
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem("lidzy_onboarding_done")
    if (!done) {
      setTimeout(() => setOpen(true), 800)
    }
  }, [])

  function finish() {
    localStorage.setItem("lidzy_onboarding_done", "1")
    setOpen(false)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish() }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="flex h-1 bg-muted">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 transition-colors" style={{ background: i <= step ? "hsl(var(--primary))" : undefined }} />
          ))}
        </div>

        <div className="p-8 space-y-6">
          {/* Icon + title */}
          <div className="flex flex-col items-center text-center gap-3">
            {current.icon}
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>

          {/* Detail */}
          <div className="rounded-lg bg-muted/50 p-4">
            {typeof current.detail === "string"
              ? <p className="text-sm text-muted-foreground text-center">{current.detail}</p>
              : current.detail}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
            {isLast ? (
              <Button size="sm" onClick={finish} className="gap-1">
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <button onClick={finish} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
