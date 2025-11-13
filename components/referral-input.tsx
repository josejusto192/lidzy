"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface ReferralInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ReferralInput({ value, onChange, className }: ReferralInputProps) {
  const [validating, setValidating] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)
  const [referrerName, setReferrerName] = useState<string>("")

  useEffect(() => {
    // Check URL parameter on mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get("ref")
      if (refCode && !value) {
        onChange(refCode)
      }
    }
  }, [])

  useEffect(() => {
    if (!value || value.length < 8) {
      setValid(null)
      setReferrerName("")
      return
    }

    const timeout = setTimeout(async () => {
      setValidating(true)
      try {
        const response = await fetch(`/api/referrals/validate?codigo=${value}`)
        const data = await response.json()

        if (data.valid) {
          setValid(true)
          setReferrerName(data.referrer?.nome || "")
        } else {
          setValid(false)
          setReferrerName("")
        }
      } catch (error) {
        setValid(false)
        setReferrerName("")
      } finally {
        setValidating(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <div className={className}>
      <Label htmlFor="referral-code">Código de Indicação (Opcional)</Label>
      <div className="relative">
        <Input
          id="referral-code"
          placeholder="Digite o código"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="pr-10"
        />
        {validating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {!validating && valid === true && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
        )}
        {!validating && valid === false && value.length >= 8 && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
        )}
      </div>
      {valid === true && referrerName && (
        <div className="mt-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Indicado por {referrerName} • Você ganhará 300 créditos bônus!
          </Badge>
        </div>
      )}
      {valid === false && value.length >= 8 && (
        <p className="text-sm text-destructive mt-2">Código de indicação inválido</p>
      )}
      {!value && (
        <p className="text-xs text-muted-foreground mt-2">
          Tem um código de indicação? Digite acima para ganhar 300 créditos bônus!
        </p>
      )}
    </div>
  )
}
