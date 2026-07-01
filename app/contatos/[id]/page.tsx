"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Calendar,
  MessageCircle, Edit, FolderKanban, Tag, ExternalLink,
  Briefcase, DollarSign, Users, Info, CheckCircle, XCircle,
} from "lucide-react"
import { STATUS_CONFIG } from "@/lib/status-config"
import { ContactTagsManager } from "@/components/contact-tags-manager"
import { ContactOriginSelector } from "@/components/contact-origin-selector"

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Socio {
  nome?: string
  qualificacao?: string
  data_entrada?: string
  cpf_cnpj?: string
}

interface CnaeSecundario {
  codigo?: string
  descricao?: string
}

interface Contato {
  id: string
  nome_empresa: string
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  cnpj_raiz?: string
  matriz_filial?: string
  telefone: string
  telefone_tipo?: string
  email?: string
  email_valido?: boolean
  email_dominio?: string
  endereco?: string
  cep?: string
  logradouro?: string
  numero_endereco?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  website?: string
  instagram_url?: string
  linkedin_url?: string
  facebook_url?: string
  site_url?: string
  status: string
  nicho?: string
  cnae_principal_codigo?: string
  cnae_principal_descricao?: string
  cnaes_secundarios?: CnaeSecundario[]
  regiao?: string
  valor?: number
  origem?: string
  criado_em: string
  data_contato?: string
  data_abertura?: string
  data_followup?: string
  situacao_cadastral?: string
  situacao_motivo?: string
  porte_empresa?: string
  natureza_juridica?: string
  capital_social?: number
  eh_mei?: boolean
  optante_simples?: boolean
  quadro_societario?: Socio[]
  photo?: string
  tags?: Array<{ id: string; nome: string; cor: string }>
}

interface Projeto {
  id: string; nome: string; descricao?: string; status: string; prioridade: string
  valor_total?: number; progresso: number; data_entrega_prevista?: string; created_at: string; funcao?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatarValor(valor?: number) {
  if (!valor) return null
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(data?: string | null) {
  if (!data) return null
  return new Date(data).toLocaleDateString("pt-BR")
}

function formatCNPJ(raw?: string) {
  if (!raw) return null
  const d = raw.replace(/\D/g, "")
  if (d.length !== 14) return raw
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

function BoolBadge({ label, value }: { label: string; value?: boolean }) {
  if (value === undefined || value === null) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
      {value ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContatoPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [contato, setContato] = useState<Contato | null>(null)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchContatoDetalhes() }, [params.id])

  const fetchContatoDetalhes = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/contatos/${params.id}`)
      if (!res.ok) throw new Error("Erro ao buscar contato")
      const data = await res.json()
      setContato(data.contato)
      setProjetos(data.projetos || [])
    } catch (error) {
      console.error("[v0] Erro ao buscar contato:", error)
      toast.error("Erro ao carregar perfil do lead")
    } finally {
      setLoading(false)
    }
  }

  const abrirWhatsApp = () => {
    if (!contato?.telefone) { toast.error("Telefone não disponível"); return }
    window.open(`https://wa.me/${contato.telefone.replace(/\D/g, "")}`, "_blank")
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    if (!config) return <Badge variant="secondary">{status}</Badge>
    return <Badge className={`${config.bgClass} text-white`}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
          <Header title="Perfil do Lead" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </main>
        </div>
      </div>
    )
  }

  if (!contato) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
          <Header title="Perfil do Lead" />
          <main className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Lead não encontrado</p>
            <Button onClick={() => router.push("/contatos")}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          </main>
        </div>
      </div>
    )
  }

  const enderecoParts = [
    contato.logradouro && `${contato.logradouro}${contato.numero_endereco ? ", " + contato.numero_endereco : ""}`,
    contato.complemento,
    contato.bairro,
    contato.municipio && contato.uf ? `${contato.municipio} - ${contato.uf}` : (contato.municipio || contato.uf),
    contato.cep && `CEP ${contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}`,
  ].filter(Boolean)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Perfil do Lead" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-5">

            {/* Header nav */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push("/contatos")}>
                <ArrowLeft className="mr-2 h-4 w-4" />Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={abrirWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                </Button>
                <Button onClick={() => router.push(`/contatos/${contato.id}/editar`)}>
                  <Edit className="mr-2 h-4 w-4" />Editar
                </Button>
              </div>
            </div>

            {/* ── Card principal ── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={contato.photo || undefined} alt={contato.nome_empresa} />
                    <AvatarFallback className="text-xl">
                      {contato.nome_empresa.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl leading-tight">{contato.nome_empresa}</CardTitle>
                    {contato.razao_social && contato.razao_social !== contato.nome_empresa && (
                      <p className="text-sm text-muted-foreground mt-0.5">{contato.razao_social}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {getStatusBadge(contato.status)}
                      {contato.situacao_cadastral && (
                        <Badge variant="outline" className={`text-xs ${contato.situacao_cadastral === "ATIVA" ? "border-green-500 text-green-600" : "border-red-500 text-red-500"}`}>
                          {contato.situacao_cadastral}
                        </Badge>
                      )}
                      {contato.matriz_filial && <Badge variant="outline" className="text-xs">{contato.matriz_filial}</Badge>}
                      <BoolBadge label="MEI" value={contato.eh_mei} />
                      <BoolBadge label="Simples Nacional" value={contato.optante_simples} />
                    </div>
                  </div>
                  {contato.valor && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-xl font-bold text-green-600">{formatarValor(contato.valor)}</p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-5">

                {/* Contato */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="text-sm font-medium">{contato.telefone} {contato.telefone_tipo && <span className="text-xs text-muted-foreground">({contato.telefone_tipo})</span>}</p>
                      </div>
                    </div>
                    {contato.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            E-mail {contato.email_valido === false && <span className="text-red-400">(inválido)</span>}
                          </p>
                          <p className="text-sm font-medium">{contato.email}</p>
                        </div>
                      </div>
                    )}
                    {contato.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <a href={contato.website} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1">
                            {contato.website}<ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    {/* Redes sociais */}
                    {[
                      { url: contato.instagram_url, label: "Instagram" },
                      { url: contato.linkedin_url, label: "LinkedIn" },
                      { url: contato.facebook_url, label: "Facebook" },
                      { url: contato.site_url, label: "Site" },
                    ].filter((s) => s.url).map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <a href={s.url!} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1">
                            {s.url}<ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Dados da Receita Federal */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />Dados da Receita Federal
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoRow label="CNPJ" value={formatCNPJ(contato.cnpj)} mono />
                    <InfoRow label="CNPJ Raiz" value={contato.cnpj_raiz} mono />
                    <InfoRow label="Matriz/Filial" value={contato.matriz_filial} />
                    <InfoRow label="Porte" value={contato.porte_empresa} />
                    <InfoRow label="Natureza Jurídica" value={contato.natureza_juridica} />
                    <InfoRow label="Situação" value={contato.situacao_cadastral} />
                    {contato.situacao_motivo && <InfoRow label="Motivo Situação" value={contato.situacao_motivo} />}
                    <InfoRow label="Data de Abertura" value={formatarData(contato.data_abertura)} />
                    {contato.capital_social != null && contato.capital_social > 0 && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Capital Social</span>
                        <span className="text-sm font-medium">{formatarValor(contato.capital_social)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CNAE */}
                {(contato.cnae_principal_codigo || contato.cnae_principal_descricao || contato.nicho) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5" />Atividade
                      </h3>
                      <div className="space-y-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">CNAE Principal</span>
                          <span className="text-sm font-medium">
                            {contato.cnae_principal_codigo && <span className="font-mono text-muted-foreground mr-2">{contato.cnae_principal_codigo}</span>}
                            {contato.cnae_principal_descricao || contato.nicho}
                          </span>
                        </div>
                        {contato.cnaes_secundarios && contato.cnaes_secundarios.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">CNAEs Secundários</span>
                            <div className="flex flex-wrap gap-1">
                              {contato.cnaes_secundarios.map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-xs">
                                  {c.codigo && <span className="font-mono text-muted-foreground">{c.codigo}</span>}
                                  {c.descricao && <span>{c.descricao}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Endereço */}
                {(enderecoParts.length > 0 || contato.endereco) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />Endereço
                      </h3>
                      {enderecoParts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {contato.logradouro && <InfoRow label="Logradouro" value={`${contato.logradouro}${contato.numero_endereco ? ", " + contato.numero_endereco : ""}`} />}
                          {contato.complemento && <InfoRow label="Complemento" value={contato.complemento} />}
                          {contato.bairro && <InfoRow label="Bairro" value={contato.bairro} />}
                          {contato.municipio && <InfoRow label="Município" value={contato.municipio} />}
                          {contato.uf && <InfoRow label="UF" value={contato.uf} />}
                          {contato.cep && <InfoRow label="CEP" value={contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")} mono />}
                        </div>
                      ) : (
                        <p className="text-sm">{contato.endereco}</p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Meta / origem */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Criado em</p>
                      <p className="text-sm font-medium">{formatarData(contato.criado_em)}</p>
                    </div>
                  </div>
                  {contato.data_contato && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Primeiro Contato</p>
                        <p className="text-sm font-medium">{formatarData(contato.data_contato)}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <ContactOriginSelector
                      contactId={contato.id}
                      currentOrigin={contato.origem}
                      onOriginChange={fetchContatoDetalhes}
                    />
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Etiquetas</p>
                  </div>
                  <ContactTagsManager
                    contatoId={contato.id}
                    currentTags={contato.tags || []}
                    onTagsChange={fetchContatoDetalhes}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Quadro Societário ── */}
            {contato.quadro_societario && contato.quadro_societario.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />Quadro Societário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Nome</th>
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Qualificação</th>
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Entrada</th>
                          <th className="text-left py-2 text-xs font-semibold text-muted-foreground">CPF/CNPJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contato.quadro_societario.map((s, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4 font-medium">{s.nome || "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{s.qualificacao || "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{s.data_entrada ? new Date(s.data_entrada).toLocaleDateString("pt-BR") : "—"}</td>
                            <td className="py-2 font-mono text-xs text-muted-foreground">{s.cpf_cnpj || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Projetos ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderKanban className="h-4 w-4" />Projetos Vinculados
                    </CardTitle>
                    <CardDescription>
                      {projetos.length === 0 ? "Nenhum projeto vinculado" : `${projetos.length} projeto(s)`}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => router.push("/projetos")}>Novo Projeto</Button>
                </div>
              </CardHeader>
              <CardContent>
                {projetos.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum projeto vinculado ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projetos.map((projeto) => (
                      <Card key={projeto.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/projetos/${projeto.id}`)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{projeto.nome}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline">{projeto.status}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{projeto.progresso}%</span>
                          </div>
                          {projeto.valor_total && projeto.valor_total > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valor</span>
                              <span className="font-medium text-green-600">{formatarValor(projeto.valor_total)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}
