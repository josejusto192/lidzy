"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, ChevronDown, ChevronUp } from "lucide-react"

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

const SITUACAO_OPTIONS = [
  { value: "ATIVA", label: "Ativa" },
  { value: "INAPTA", label: "Inapta" },
  { value: "BAIXADA", label: "Baixada" },
  { value: "SUSPENSA", label: "Suspensa" },
  { value: "NULA", label: "Nula" },
]

const PORTE_OPTIONS = [
  { value: "00", label: "Não informado" },
  { value: "01", label: "Micro Empresa (ME)" },
  { value: "03", label: "Empresa de Pequeno Porte (EPP)" },
  { value: "05", label: "Demais" },
]

interface GeradorCasaDadosProps {
  currentCredits: number
  onLeadsGenerated: () => void
  onAlert: (alert: { type: "success" | "error" | "warning" | "info"; title: string; message: string }) => void
}

interface GenerationResult {
  leadsAdded: number
  creditsUsed: number
  duplicatesSkipped: number
  totalEncontrado: number
}

export function GeradorCasaDados({ currentCredits, onLeadsGenerated, onAlert }: GeradorCasaDadosProps) {
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Filtros básicos
  const [ufs, setUfs] = useState<string[]>([])
  const [municipio, setMunicipio] = useState("")
  const [cnaePrincipal, setCnaePrincipal] = useState("")
  const [situacaoCadastral, setSituacaoCadastral] = useState<string[]>(["ATIVA"])
  const [limite, setLimite] = useState(100)
  const [buscaTextual, setBuscaTextual] = useState("")

  // Filtros avançados
  const [porte, setPorte] = useState<string[]>([])
  const [matrizFilial, setMatrizFilial] = useState("")
  const [ddd, setDdd] = useState("")
  const [dataAberturaInicio, setDataAberturaInicio] = useState("")
  const [dataAberturaFim, setDataAberturaFim] = useState("")
  const [capitalMin, setCapitalMin] = useState("")
  const [capitalMax, setCapitalMax] = useState("")
  const [cnaeSecundario, setCnaeSecundario] = useState("")
  const [naturezaJuridica, setNaturezaJuridica] = useState("")

  // Filtros de qualificação
  const [comTelefone, setComTelefone] = useState(true)
  const [comEmail, setComEmail] = useState(false)
  const [somenteCelular, setSomenteCelular] = useState(false)
  const [somenteFixo, setSomenteFixo] = useState(false)
  const [excluirEmailContab, setExcluirEmailContab] = useState(false)
  const [meiOptante, setMeiOptante] = useState<boolean | undefined>(undefined)
  const [simplesOptante, setSimplesOptante] = useState<boolean | undefined>(undefined)

  const creditEstimate = limite

  const toggleUf = (uf: string) => {
    setUfs((prev) => (prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]))
  }

  const toggleSituacao = (value: string) => {
    setSituacaoCadastral((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    )
  }

  const togglePorte = (value: string) => {
    setPorte((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]))
  }

  const buildFiltros = () => {
    const filtros: Record<string, unknown> = { limite }

    if (ufs.length) filtros.uf = ufs
    if (municipio.trim()) filtros.municipio = [municipio.trim()]
    if (cnaePrincipal.trim()) filtros.codigo_atividade_principal = [cnaePrincipal.trim()]
    if (situacaoCadastral.length) filtros.situacao_cadastral = situacaoCadastral
    if (buscaTextual.trim()) filtros.busca_textual = buscaTextual.trim()

    if (porte.length) filtros.porte_empresa = porte
    if (matrizFilial) filtros.matriz_filial = matrizFilial
    if (ddd.trim()) filtros.ddd = ddd.split(",").map((d) => d.trim()).filter(Boolean)
    if (dataAberturaInicio) filtros.data_abertura_inicio = dataAberturaInicio
    if (dataAberturaFim) filtros.data_abertura_fim = dataAberturaFim
    if (capitalMin) filtros.capital_social_minimo = Number(capitalMin)
    if (capitalMax) filtros.capital_social_maximo = Number(capitalMax)
    if (cnaeSecundario.trim()) filtros.codigo_atividade_secundaria = [cnaeSecundario.trim()]
    if (naturezaJuridica.trim()) filtros.codigo_natureza_juridica = [naturezaJuridica.trim()]

    filtros.com_telefone = comTelefone
    if (comEmail) filtros.com_email = true
    if (somenteCelular) filtros.somente_celular = true
    if (somenteFixo) filtros.somente_fixo = true
    if (excluirEmailContab) filtros.excluir_email_contab = true
    if (meiOptante !== undefined) filtros.mei_optante = meiOptante
    if (simplesOptante !== undefined) filtros.simples_optante = simplesOptante

    return filtros
  }

  const handleGerar = () => {
    setShowConfirmation(true)
  }

  const confirmAndGenerate = async () => {
    setShowConfirmation(false)
    setLoading(true)
    setGenerationResult(null)

    try {
      const response = await fetch("/api/gerar-leads/casa-dos-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildFiltros()),
      })

      const data = await response.json()

      if (response.status === 503 && data.error === "CASA_DOS_DADOS_NOT_CONFIGURED") {
        onAlert({
          type: "error",
          title: "API não configurada",
          message: "A chave da API da Casa dos Dados não está configurada no servidor.",
        })
        return
      }

      if (!response.ok) {
        if (data.error === "INSUFFICIENT_CREDITS") {
          onAlert({ type: "warning", title: "Créditos Insuficientes", message: data.message })
        } else {
          onAlert({ type: "error", title: "Erro", message: data.message || data.error || "Erro ao gerar leads." })
        }
        return
      }

      setGenerationResult({
        leadsAdded: data.total || 0,
        creditsUsed: data.creditsUsed || 0,
        duplicatesSkipped: data.duplicatesSkipped || 0,
        totalEncontrado: data.totalEncontrado || 0,
      })

      onLeadsGenerated()

      onAlert({
        type: "success",
        title: "Contatos Gerados!",
        message: data.message,
      })
    } catch {
      onAlert({ type: "error", title: "Erro", message: "Não foi possível conectar ao servidor." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Busca textual */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">
          Razão Social / Nome Fantasia
        </Label>
        <Input
          placeholder="Ex: Construtora Silva"
          value={buscaTextual}
          onChange={(e) => setBuscaTextual(e.target.value)}
          className="bg-secondary"
          disabled={loading}
        />
      </div>

      {/* UF */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">Estado (UF)</Label>
        <div className="flex flex-wrap gap-1.5">
          {UF_OPTIONS.map((uf) => (
            <button
              key={uf}
              type="button"
              onClick={() => toggleUf(uf)}
              disabled={loading}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                ufs.includes(uf)
                  ? "bg-blue-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {uf}
            </button>
          ))}
        </div>
      </div>

      {/* Município */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">Município</Label>
        <Input
          placeholder="Ex: São Paulo"
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          className="bg-secondary"
          disabled={loading}
        />
      </div>

      {/* CNAE */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">
          CNAE Principal
        </Label>
        <Input
          placeholder="Ex: 4120400 (Construção de edifícios)"
          value={cnaePrincipal}
          onChange={(e) => setCnaePrincipal(e.target.value)}
          className="bg-secondary"
          disabled={loading}
        />
      </div>

      {/* Situação Cadastral */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">
          Situação Cadastral
        </Label>
        <div className="flex flex-wrap gap-2">
          {SITUACAO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleSituacao(opt.value)}
              disabled={loading}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                situacaoCadastral.includes(opt.value)
                  ? "bg-blue-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Qualificação rápida */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">Qualificação</Label>
        <div className="rounded-lg bg-secondary p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="com_telefone"
              checked={comTelefone}
              onCheckedChange={(v) => setComTelefone(!!v)}
              disabled={loading}
            />
            <label htmlFor="com_telefone" className="text-sm text-foreground cursor-pointer">
              Somente com telefone
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="com_email"
              checked={comEmail}
              onCheckedChange={(v) => setComEmail(!!v)}
              disabled={loading}
            />
            <label htmlFor="com_email" className="text-sm text-foreground cursor-pointer">
              Somente com e-mail
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="excluir_email_contab"
              checked={excluirEmailContab}
              onCheckedChange={(v) => setExcluirEmailContab(!!v)}
              disabled={loading}
            />
            <label htmlFor="excluir_email_contab" className="text-sm text-foreground cursor-pointer">
              Excluir e-mails de contabilidade
            </label>
          </div>
        </div>
      </div>

      {/* Filtros Avançados (colapsável) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
          disabled={loading}
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAdvanced ? "Ocultar filtros avançados" : "Mostrar filtros avançados"}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 rounded-lg border border-border p-4">
            {/* Porte */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">Porte da Empresa</Label>
              <div className="flex flex-wrap gap-2">
                {PORTE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePorte(opt.value)}
                    disabled={loading}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      porte.includes(opt.value)
                        ? "bg-blue-600 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matriz/Filial */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">Matriz / Filial</Label>
              <Select value={matrizFilial} onValueChange={setMatrizFilial} disabled={loading}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Ambos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ambos</SelectItem>
                  <SelectItem value="MATRIZ">Somente Matriz</SelectItem>
                  <SelectItem value="FILIAL">Somente Filial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DDD */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">
                DDD (separados por vírgula)
              </Label>
              <Input
                placeholder="Ex: 11, 21, 31"
                value={ddd}
                onChange={(e) => setDdd(e.target.value)}
                className="bg-secondary"
                disabled={loading}
              />
            </div>

            {/* Data de Abertura */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block text-sm font-medium text-card-foreground">Abertura: De</Label>
                <Input
                  type="date"
                  value={dataAberturaInicio}
                  onChange={(e) => setDataAberturaInicio(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-card-foreground">Abertura: Até</Label>
                <Input
                  type="date"
                  value={dataAberturaFim}
                  onChange={(e) => setDataAberturaFim(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Capital Social */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block text-sm font-medium text-card-foreground">Capital Mín. (R$)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={capitalMin}
                  onChange={(e) => setCapitalMin(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-card-foreground">Capital Máx. (R$)</Label>
                <Input
                  type="number"
                  placeholder="Sem limite"
                  value={capitalMax}
                  onChange={(e) => setCapitalMax(e.target.value)}
                  className="bg-secondary"
                  disabled={loading}
                />
              </div>
            </div>

            {/* CNAE Secundário */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">CNAE Secundário</Label>
              <Input
                placeholder="Ex: 9602501"
                value={cnaeSecundario}
                onChange={(e) => setCnaeSecundario(e.target.value)}
                className="bg-secondary"
                disabled={loading}
              />
            </div>

            {/* Natureza Jurídica */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">Código Natureza Jurídica</Label>
              <Input
                placeholder="Ex: 2062 (Soc. Empresária Ltda)"
                value={naturezaJuridica}
                onChange={(e) => setNaturezaJuridica(e.target.value)}
                className="bg-secondary"
                disabled={loading}
              />
            </div>

            {/* Tipo de telefone */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">Tipo de Telefone</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="somente_celular"
                    checked={somenteCelular}
                    onCheckedChange={(v) => { setSomenteCelular(!!v); if (v) setSomenteFixo(false) }}
                    disabled={loading}
                  />
                  <label htmlFor="somente_celular" className="text-sm text-foreground cursor-pointer">Celular</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="somente_fixo"
                    checked={somenteFixo}
                    onCheckedChange={(v) => { setSomenteFixo(!!v); if (v) setSomenteCelular(false) }}
                    disabled={loading}
                  />
                  <label htmlFor="somente_fixo" className="text-sm text-foreground cursor-pointer">Fixo</label>
                </div>
              </div>
            </div>

            {/* MEI / Simples */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">Regime Tributário</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mei_optante"
                    checked={meiOptante === true}
                    onCheckedChange={(v) => setMeiOptante(v ? true : undefined)}
                    disabled={loading}
                  />
                  <label htmlFor="mei_optante" className="text-sm text-foreground cursor-pointer">MEI</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="simples_optante"
                    checked={simplesOptante === true}
                    onCheckedChange={(v) => setSimplesOptante(v ? true : undefined)}
                    disabled={loading}
                  />
                  <label htmlFor="simples_optante" className="text-sm text-foreground cursor-pointer">Simples Nacional</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Limite de resultados */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-card-foreground">
          Quantidade de empresas (máx. 1000)
        </Label>
        <div className="rounded-lg bg-secondary p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{limite} empresas</span>
            <span className="text-xs text-muted-foreground">~{limite} créditos</span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            disabled={loading}
            className="w-full accent-blue-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>500</span>
            <span>1000</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Seu saldo:</span>
            <span className={currentCredits >= creditEstimate ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
              {currentCredits} créditos
            </span>
          </div>
        </div>
      </div>

      {/* Resultado anterior */}
      {generationResult && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-green-500">Última Geração</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Encontrados na API</p>
              <p className="text-lg font-bold text-foreground">{generationResult.totalEncontrado.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Salvos</p>
              <p className="text-lg font-bold text-green-500">{generationResult.leadsAdded}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Créditos Gastos</p>
              <p className="text-lg font-bold text-green-500">{generationResult.creditsUsed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duplicados</p>
              <p className="text-lg font-bold text-orange-500">{generationResult.duplicatesSkipped}</p>
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={handleGerar}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Consultando...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Buscar por CNPJ
          </>
        )}
      </Button>

      {/* Modal de confirmação */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Busca Casa dos Dados</DialogTitle>
            <DialogDescription>Revise os parâmetros antes de continuar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 space-y-2 text-sm">
              {ufs.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estados:</span>
                  <span className="font-medium">{ufs.join(", ")}</span>
                </div>
              )}
              {municipio && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Município:</span>
                  <span className="font-medium">{municipio}</span>
                </div>
              )}
              {cnaePrincipal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNAE:</span>
                  <span className="font-medium">{cnaePrincipal}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Situação:</span>
                <span className="font-medium">{situacaoCadastral.join(", ") || "Todas"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-medium">{limite} empresas</span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimativa de créditos:</span>
                <span className="text-lg font-bold text-blue-500">~{creditEstimate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Seu saldo atual:</span>
                <span className={`text-lg font-bold ${currentCredits >= creditEstimate ? "text-green-500" : "text-red-500"}`}>
                  {currentCredits}
                </span>
              </div>
              {currentCredits < creditEstimate && (
                <p className="text-xs text-red-500">Saldo insuficiente para esta operação.</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              * Créditos são cobrados apenas pelos contatos efetivamente salvos (novos, sem duplicatas).
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmAndGenerate}
                disabled={currentCredits < creditEstimate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirmar e Buscar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
