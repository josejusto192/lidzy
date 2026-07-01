"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Building2, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  onCreated?: () => void
}

const NICHOS = [
  "Tecnologia", "Saúde", "Educação", "Varejo", "Alimentação", "Construção",
  "Financeiro", "Jurídico", "Marketing", "Logística", "Indústria", "Outros",
]

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

const emptyForm = {
  tipo_pessoa: "juridica" as "juridica" | "fisica",
  // PJ
  nome_empresa: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  cnae_principal: "",
  cnae_principal_descricao: "",
  porte_empresa: "",
  natureza_juridica: "",
  data_abertura: "",
  capital_social: "",
  eh_mei: "",
  optante_simples: "",
  // PF
  nome_completo: "",
  cpf: "",
  // Comuns
  telefone: "",
  email: "",
  website: "",
  nicho: "",
  regiao: "",
  status: "pendente",
  valor: "",
  notas: "",
  municipio: "",
  uf: "",
  cep: "",
  logradouro: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  instagram_url: "",
  linkedin_url: "",
  facebook_url: "",
  site_url: "",
}

export function NovoContatoManual({ onCreated }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(emptyForm)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function reset() {
    setForm(emptyForm)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const isPF = form.tipo_pessoa === "fisica"
    if (isPF && !form.nome_completo) { setError("Nome completo é obrigatório"); return }
    if (!isPF && !form.nome_empresa && !form.razao_social) { setError("Nome da empresa é obrigatório"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao criar contato"); return }
      setOpen(false)
      reset()
      onCreated?.()
      router.push(`/contatos/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  const isPF = form.tipo_pessoa === "fisica"

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Inserir manualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Tipo de pessoa */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => set("tipo_pessoa", "juridica")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${!isPF ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
              <Building2 className="h-4 w-4" /> Pessoa Jurídica
            </button>
            <button type="button"
              onClick={() => set("tipo_pessoa", "fisica")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${isPF ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
              <User className="h-4 w-4" /> Pessoa Física
            </button>
          </div>

          <Tabs defaultValue="basico">
            <TabsList className="w-full">
              <TabsTrigger value="basico" className="flex-1">Básico</TabsTrigger>
              <TabsTrigger value="endereco" className="flex-1">Endereço</TabsTrigger>
              {!isPF && <TabsTrigger value="empresa" className="flex-1">Empresa</TabsTrigger>}
              <TabsTrigger value="redes" className="flex-1">Redes Sociais</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-3 pt-3">
              {isPF ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Nome Completo *</Label>
                      <Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Ex: João da Silva" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>CPF</Label>
                      <Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-1">
                      <Label>Telefone</Label>
                      <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Nome da Empresa *</Label>
                      <Input value={form.nome_empresa} onChange={e => set("nome_empresa", e.target.value)} placeholder="Ex: Acme Ltda" />
                    </div>
                    <div className="space-y-1">
                      <Label>CNPJ</Label>
                      <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Razão Social</Label>
                      <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome Fantasia</Label>
                      <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Nicho</Label>
                  <Select value={form.nicho} onValueChange={v => set("nicho", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {NICHOS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Região</Label>
                  <Input value={form.regiao} onChange={e => set("regiao", e.target.value)} placeholder="Ex: Sudeste" />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_contato">Em contato</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valor estimado (R$)</Label>
                  <Input type="number" value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notas</Label>
                <Textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3} placeholder="Observações sobre o contato..." />
              </div>
            </TabsContent>

            <TabsContent value="endereco" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Logradouro</Label>
                  <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Avenida..." />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input value={form.numero_endereco} onChange={e => set("numero_endereco", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Complemento</Label>
                  <Input value={form.complemento} onChange={e => set("complemento", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
                </div>
                <div className="space-y-1">
                  <Label>Município</Label>
                  <Input value={form.municipio} onChange={e => set("municipio", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>UF</Label>
                  <Select value={form.uf} onValueChange={v => set("uf", v)}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {!isPF && (
              <TabsContent value="empresa" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>CNAE Principal (código)</Label>
                    <Input value={form.cnae_principal} onChange={e => set("cnae_principal", e.target.value)} placeholder="Ex: 6201-5/01" />
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição do CNAE</Label>
                    <Input value={form.cnae_principal_descricao} onChange={e => set("cnae_principal_descricao", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Porte</Label>
                    <Select value={form.porte_empresa} onValueChange={v => set("porte_empresa", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="ME">Microempresa</SelectItem>
                        <SelectItem value="EPP">Pequeno Porte</SelectItem>
                        <SelectItem value="MEDIO">Médio Porte</SelectItem>
                        <SelectItem value="GRANDE">Grande Porte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Natureza Jurídica</Label>
                    <Input value={form.natureza_juridica} onChange={e => set("natureza_juridica", e.target.value)} placeholder="Ex: Sociedade Limitada" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Data de Abertura</Label>
                    <Input type="date" value={form.data_abertura} onChange={e => set("data_abertura", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Capital Social (R$)</Label>
                    <Input type="number" value={form.capital_social} onChange={e => set("capital_social", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>MEI?</Label>
                    <Select value={form.eh_mei} onValueChange={v => set("eh_mei", v)}>
                      <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Optante Simples?</Label>
                    <Select value={form.optante_simples} onValueChange={v => set("optante_simples", v)}>
                      <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="redes" className="space-y-3 pt-3">
              <div className="space-y-1">
                <Label>Instagram</Label>
                <Input value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-1">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1">
                <Label>Facebook</Label>
                <Input value={form.facebook_url} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-1">
                <Label>Site</Label>
                <Input value={form.site_url} onChange={e => set("site_url", e.target.value)} placeholder="https://" />
              </div>
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar contato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
