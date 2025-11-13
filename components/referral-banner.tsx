"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, X } from "lucide-react"
import Link from "next/link"

export function ReferralBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed
    const isDismissed = localStorage.getItem("referral-banner-dismissed")
    if (isDismissed) {
      setDismissed(true)
      return
    }

    // Check if user has any referrals
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats && data.stats.total === 0) {
          setShow(true)
        }
      })
      .catch(() => {
        // Silent fail
      })
  }, [])

  const dismiss = () => {
    localStorage.setItem("referral-banner-dismissed", "true")
    setShow(false)
    setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <Card className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-4 pr-8">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Ganhe 500 créditos grátis!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Indique amigos para o Lidzy e ganhe 500 créditos para cada amigo que se cadastrar.
            Seu amigo também ganha 300 créditos! 🎉
          </p>
          <Link href="/indicacoes">
            <Button size="sm">
              Começar a Indicar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
