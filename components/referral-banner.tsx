"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, X, AlertCircle } from "lucide-react"
import Link from "next/link"

export function ReferralBanner() {
  const [mode, setMode] = useState<"pending_cpf" | "invite" | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem("referral-banner-dismissed")
    if (isDismissed) { setDismissed(true); return }

    fetch("/api/referrals")
      .then(r => r.json())
      .then(data => {
        // Tem indicação recebida pendente (bônus ainda não liberado)?
        if (data.my_referral && !data.my_referral.bonus_liberado) {
          setMode("pending_cpf")
        } else if (data.stats?.total === 0 && !data.my_referral) {
          setMode("invite")
        }
      })
      .catch(() => {})
  }, [])

  const dismiss = () => {
    localStorage.setItem("referral-banner-dismissed", "true")
    setDismissed(true)
    setMode(null)
  }

  if (!mode || dismissed) return null

  if (mode === "pending_cpf") {
    return (
      <Card className="relative bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 border-amber-300 dark:border-amber-700 p-4 mb-6">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-amber-800 dark:text-amber-300">
              Você foi indicado! Libere seus 300 créditos 🎁
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              Complete seu perfil com seu CPF para liberar os créditos de bônus da indicação. Isso nos ajuda a manter a segurança da plataforma.
            </p>
            <Link href="/configuracoes">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                Completar perfil agora
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4 mb-6">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={dismiss}>
        <X className="h-4 w-4" />
      </Button>
      <div className="flex items-start gap-4 pr-8">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Ganhe 500 créditos grátis!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Indique amigos para o Lidzy e ganhe 500 créditos para cada amigo que completar o perfil.
            Seu amigo também ganha 300 créditos! 🎉
          </p>
          <Link href="/indicacoes">
            <Button size="sm">Começar a Indicar</Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
