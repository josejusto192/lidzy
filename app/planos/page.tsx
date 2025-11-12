"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Plano {
  id: string
  nome: string
  descricao: string
  creditos_mensais: number
  preco_mensal: number
  preco_anual: number
  features: string[]
}

export default function PlanosPage() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null)
  const [periodo, setPeriodo] = useState<"monthly" | "yearly">("monthly")
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cpfCnpj: "",
    email: "",
    phone: "",
    postalCode: "",
    address: "",
    addressNumber: "",
    province: "",
  })

  useEffect(() => {
    checkAuth()
    loadPlanos()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
    }
  }

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from("planos")
        .select("*")
        .eq("ativo", true)
        .order("preco_mensal", { ascending: true })
        .limit(3) // Only show 3 plans

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error("[v0] Erro ao carregar planos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlano = (plano: Plano) => {
    setSelectedPlano(plano)
    setShowCheckout(true)
  }

  const handleCheckout = async () => {
    if (!selectedPlano) return

    setCheckoutLoading(true)
    try {
      // Criar cliente no Asaas
      const customerResponse = await fetch("/api/asaas/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!customerResponse.ok) throw new Error("Erro ao criar cliente")

      const { customerId } = await customerResponse.json()

      // Criar assinatura
      const subscriptionResponse = await fetch("/api/asaas/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planoId: selectedPlano.id,
          periodo,
          customerId,
        }),
      })

      if (!subscriptionResponse.ok) throw new Error("Erro ao criar assinatura")

      const { paymentUrl } = await subscriptionResponse.json()

      // Redirecionar para página de pagamento
      window.open(paymentUrl, "_blank")
      setShowCheckout(false)
      router.push("/creditos")
    } catch (error) {
      console.error("[v0] Erro ao processar checkout:", error)
      alert("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Planos e Assinaturas" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Escolha o plano ideal para você</h1>
              <p className="text-muted-foreground">Todos os planos incluem geração de leads e mensagens com IA</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <Button variant={periodo === "monthly" ? "default" : "outline"} onClick={() => setPeriodo("monthly")}>
                Mensal
              </Button>
              <Button variant={periodo === "yearly" ? "default" : "outline"} onClick={() => setPeriodo("yearly")}>
                Anual{" "}
                <Badge className="ml-2" variant="secondary">
                  -20%
                </Badge>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {planos.map((plano) => {
                const preco = periodo === "yearly" ? plano.preco_anual : plano.preco_mensal
                const precoMensal = periodo === "yearly" ? plano.preco_anual / 12 : plano.preco_mensal

                return (
                  <Card key={plano.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{plano.nome}</CardTitle>
                      <CardDescription>{plano.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div>
                        <div className="text-3xl font-bold">
                          R$ {precoMensal.toFixed(2)}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                        {periodo === "yearly" && (
                          <div className="text-sm text-muted-foreground">R$ {preco.toFixed(2)} cobrado anualmente</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold">{plano.creditos_mensais.toLocaleString()} créditos/mês</div>
                        {plano.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleSelectPlano(plano)}>
                        Assinar agora
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar assinatura</DialogTitle>
            <DialogDescription>
              Preencha seus dados para concluir a assinatura do plano {selectedPlano?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  value={formData.addressNumber}
                  onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="province">Estado</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
