"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("[v0] Iniciando login...")
    console.log("[v0] Email:", email)

    try {
      const supabase = createClient()
      console.log("[v0] Cliente Supabase criado")

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Resposta do login:", { data, error: signInError })

      if (signInError) {
        console.error("[v0] Erro de autenticação:", signInError)
        setError(signInError.message)
        return
      }

      if (data.user) {
        console.log("[v0] Login bem-sucedido, redirecionando...")
        window.location.href = "/"
      } else {
        console.error("[v0] Login sem usuário retornado")
        setError("Erro ao fazer login. Nenhum usuário retornado.")
      }
    } catch (err) {
      console.error("[v0] Exceção durante login:", err)
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="light flex min-h-screen">
      {/* Left Side - Login Form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-2/5 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex items-center justify-start">
            <img
              src="/images/design-mode/Logoisolado.svg"
              alt="Lidzy"
              className="h-16 w-auto"
            />
          </div>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">Bem-vindo de volta!</h1>
            <p className="text-pretty text-muted-foreground">Estamos felizes em vê-lo novamente</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                  Lembrar-me
                </Label>
              </div>
              <button type="button" className="text-sm font-medium text-primary transition-colors hover:underline">
                Esqueceu a senha?
              </button>
            </div>

            <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <a href="/signup" className="font-medium text-primary transition-colors hover:underline">
              Criar conta
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-green-400 lg:block lg:w-3/5">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-4 top-0 h-96 w-96 animate-blob rounded-full bg-white mix-blend-overlay blur-3xl"></div>
          <div className="animation-delay-2000 absolute -left-4 top-0 h-96 w-96 animate-blob rounded-full bg-green-200 mix-blend-overlay blur-3xl"></div>
          <div className="animation-delay-4000 absolute -bottom-8 left-20 h-96 w-96 animate-blob rounded-full bg-green-300 mix-blend-overlay blur-3xl"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg space-y-6 text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-lg bg-white/20"></div>
            </div>
            <h2 className="text-balance text-4xl font-bold leading-tight">Gerencie seus leads com inteligência</h2>
            <p className="text-pretty text-lg text-green-50">
              Automatize sua prospecção, acompanhe conversas e converta mais clientes com o Lidzy
            </p>
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

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/30 to-transparent"></div>
      </div>
    </div>
  )
}
