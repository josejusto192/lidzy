"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  CreditCard,
  ArrowUpRight,
  Loader2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Building2,
  Sparkles,
  Camera,
  Trash2,
} from "lucide-react"

interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string
  data_nascimento?: string
  cpf_cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  creditos: number
  foto_perfil?: string
}

interface Plano {
  id: string
  nome: string
  descricao: string
  preco_mensal: number
  preco_anual: number
  creditos_mensais: number
}

interface Assinatura {
  id: string
  status: string
  periodo: string
  data_inicio: string
  proxima_cobranca: string
  planos: Plano
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    try {
      const response = await fetch("/api/usuario/perfil")
      if (!response.ok) throw new Error("Erro ao buscar dados")

      const data = await response.json()
      setUsuario(data.usuario)
      setAssinatura(data.assinatura)

      // Preenche formulário com dados existentes
      setFormData({
        nome: data.usuario.nome || "",
        telefone: data.usuario.telefone || "",
        data_nascimento: data.usuario.data_nascimento || "",
        cpf_cnpj: data.usuario.cpf_cnpj || "",
        endereco: data.usuario.endereco || "",
        cidade: data.usuario.cidade || "",
        estado: data.usuario.estado || "",
        cep: data.usuario.cep || "",
      })
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/usuario/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Erro ao salvar dados")

      const data = await response.json()
      setUsuario(data.usuario)
      alert("Dados atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
      alert("Erro ao salvar dados. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/usuario/foto", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao fazer upload")
      }

      const data = await response.json()
      setUsuario((prev) => (prev ? { ...prev, foto_perfil: data.url } : null))

      // Recarrega a página para atualizar o avatar no header
      window.location.reload()
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert(error instanceof Error ? error.message : "Erro ao fazer upload da foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoRemove = async () => {
    if (!confirm("Deseja remover sua foto de perfil?")) return

    setUploadingPhoto(true)
    try {
      const response = await fetch("/api/usuario/foto", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao remover foto")

      setUsuario((prev) => (prev ? { ...prev, foto_perfil: undefined } : null))

      // Recarrega a página para atualizar o avatar no header
      window.location.reload()
    } catch (error) {
      console.error("Erro ao remover foto:", error)
      alert("Erro ao remover foto. Tente novamente.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    data_nascimento: "",
    cpf_cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
          <Header title="Perfil" />
          <main className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Perfil" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-10">
              <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl md:h-28 md:w-28">
                    <AvatarImage src={usuario?.foto_perfil || "/placeholder.svg"} alt={usuario?.nome} />
                    <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                      {usuario ? getInitials(usuario.nome) : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>

                    {usuario?.foto_perfil && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={handlePhotoRemove}
                        disabled={uploadingPhoto}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-foreground md:text-4xl">{usuario?.nome}</h1>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {usuario?.email}
                    </div>
                    {usuario?.telefone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {usuario.telefone}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      <span className="text-2xl font-bold text-primary">{usuario?.creditos.toLocaleString()}</span>
                      <span className="ml-1 text-muted-foreground">créditos disponíveis</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-0 h-full w-1/3 opacity-5">
                <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-primary blur-3xl" />
                <div className="absolute bottom-10 right-20 h-40 w-40 rounded-full bg-primary blur-3xl" />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Mantenha seus dados atualizados</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          Nome Completo *
                        </Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Seu nome completo"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Label>
                        <Input id="email" value={usuario?.email} disabled className="h-11 bg-muted" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone" className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          Telefone
                        </Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="(00) 00000-0000"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data_nascimento" className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          Data de Nascimento
                        </Label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cpf_cnpj" className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          CPF/CNPJ
                        </Label>
                        <Input
                          id="cpf_cnpj"
                          value={formData.cpf_cnpj}
                          onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            value={formData.cep}
                            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                            placeholder="00000-000"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input
                            id="estado"
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                            placeholder="UF"
                            maxLength={2}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="endereco">Logradouro</Label>
                          <Input
                            id="endereco"
                            value={formData.endereco}
                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                            placeholder="Rua, número, complemento"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            value={formData.cidade}
                            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                            placeholder="Sua cidade"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={fetchData} disabled={saving} size="lg">
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[140px]">
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar Alterações"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Meu Plano</CardTitle>
                        <CardDescription>Assinatura ativa</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assinatura ? (
                      <>
                        <div className="rounded-lg bg-primary/5 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-lg font-bold text-foreground">{assinatura.planos.nome}</p>
                            <Badge variant={assinatura.status === "active" ? "default" : "secondary"}>
                              {assinatura.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{assinatura.planos.descricao}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                            <span className="text-sm text-muted-foreground">Créditos/mês</span>
                            <span className="font-semibold">{assinatura.planos.creditos_mensais.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                            <span className="text-sm text-muted-foreground">Valor</span>
                            <span className="font-semibold">
                              R${" "}
                              {assinatura.periodo === "monthly"
                                ? assinatura.planos.preco_mensal
                                : assinatura.planos.preco_anual}
                              /{assinatura.periodo === "monthly" ? "mês" : "ano"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                            <span className="text-sm text-muted-foreground">Próxima cobrança</span>
                            <span className="font-semibold">
                              {new Date(assinatura.proxima_cobranca).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <Button onClick={() => router.push("/planos")} className="w-full" size="lg">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Fazer Upgrade
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4 py-6 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Nenhum plano ativo</p>
                          <p className="text-sm text-muted-foreground">Assine um plano para começar</p>
                        </div>
                        <Button onClick={() => router.push("/planos")} className="w-full" size="lg">
                          Ver Planos Disponíveis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
