"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, Lock, Eye, EyeOff, User, Gift } from "lucide-react"

export default function SignupPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refCode, setRefCode] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setRefCode(ref.toUpperCase())
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Salva código para aplicar após confirmar email e logar
        if (refCode) localStorage.setItem("lidzy_ref_code", refCode)
        setSuccess(true)
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="light flex min-h-screen items-center justify-center bg-white p-8">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-12 w-12 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Verifique seu email</h1>
            <p className="text-muted-foreground">
              Enviamos um link de confirmação para{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Clique no link do email para ativar sua conta e acessar o Lidzy.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm text-amber-800">
              <strong>Não recebeu?</strong> Verifique a pasta de spam ou lixo eletrônico.
            </p>
          </div>
          {refCode && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-left">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <Gift className="h-4 w-4 shrink-0" />
                <span>Seu bônus de <strong>300 créditos</strong> será aplicado automaticamente ao entrar pela primeira vez.</span>
              </p>
            </div>
          )}
          <a href="/login" className="block text-sm font-medium text-primary hover:underline">
            Já confirmei meu email — fazer login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="light flex min-h-screen">
      {/* Left Side */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-2/5 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex items-center justify-start">
            <img src="/images/design-mode/Logoisolado.svg" alt="Lidzy" className="h-16 w-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">Criar sua conta</h1>
            <p className="text-pretty text-muted-foreground">Preencha os dados abaixo para começar</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="nome" type="text" placeholder="Digite seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12 pl-10" required disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Digite seu email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 pr-10" required disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pl-10 pr-10" required disabled={loading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refCode" className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                Código de indicação
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input id="refCode" type="text" placeholder="Ex: AB12CD34" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} className="h-12 font-mono tracking-widest" disabled={loading} />
              {refCode && (
                <p className="text-xs text-green-600 font-medium">Você ganhará 300 créditos bônus ao criar sua conta!</p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Criando conta...</> : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <a href="/login" className="font-medium text-primary transition-colors hover:underline">Fazer login</a>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-green-400 lg:block lg:w-3/5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-4 top-0 h-96 w-96 animate-blob rounded-full bg-white mix-blend-overlay blur-3xl"></div>
          <div className="animation-delay-2000 absolute -left-4 top-0 h-96 w-96 animate-blob rounded-full bg-green-200 mix-blend-overlay blur-3xl"></div>
          <div className="animation-delay-4000 absolute -bottom-8 left-20 h-96 w-96 animate-blob rounded-full bg-green-300 mix-blend-overlay blur-3xl"></div>
        </div>
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg space-y-6 text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-lg bg-white/20"></div>
            </div>
            <h2 className="text-balance text-4xl font-bold leading-tight">Comece a gerar leads hoje</h2>
            <p className="text-pretty text-lg text-green-50">Junte-se a empresas que já automatizam sua prospecção com o Lidzy</p>
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">10k+</div>
                <div className="text-sm text-green-100">Leads Gerados</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">95%</div>
                <div className="text-sm text-green-100">Taxa de Entrega</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-green-100">Automação</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/30 to-transparent"></div>
      </div>
    </div>
  )
}
