"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InfoTooltip } from "@/components/info-tooltip"
import { toast } from "sonner"

// ── Constantes ────────────────────────────────────────────────────────────────

const UF_LIST = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"]
const SITUACOES = ["ATIVA","INAPTA","BAIXADA","SUSPENSA","NULA"]
const PORTES = [
  { value: "01", label: "ME" },
  { value: "03", label: "EPP" },
  { value: "05", label: "Demais" },
]

function stripCnae(c: string) { return (c || "").replace(/[-/]/g, "") }

// ── CNAE lazy-load do IBGE ───────────────────────────────────────────────────

interface CnaeItem { codigo: string; descricao: string }
let cnaeCache: CnaeItem[] | null = null
let cnaePromise: Promise<CnaeItem[]> | null = null

async function loadCnaes(): Promise<CnaeItem[]> {
  if (cnaeCache) return cnaeCache
  if (cnaePromise) return cnaePromise
  cnaePromise = fetch("https://servicodados.ibge.gov.br/api/v2/cnae/subclasses")
    .then((r) => r.json())
    .then((data: { id: string; descricao: string }[]) => {
      cnaeCache = data.map((c) => ({ codigo: c.id, descricao: c.descricao }))
      return cnaeCache!
    })
    .catch(() => { cnaeCache = []; return [] })
  return cnaePromise
}

// ── Municípios lazy-load do IBGE ─────────────────────────────────────────────

const muniCache: Record<string, string[]> = {}

async function loadMunicipios(ufs: string[]): Promise<string[]> {
  const toFetch = ufs.filter((uf) => !muniCache[uf])
  await Promise.all(toFetch.map((uf) =>
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => { muniCache[uf] = data.map((m) => m.nome) })
      .catch(() => { muniCache[uf] = [] })
  ))
  return [...new Set(ufs.flatMap((uf) => muniCache[uf] || []))].sort((a, b) => a.localeCompare(b, "pt"))
}

// ── Form state ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  termo: "", tipo_busca: "radical",
  ufs: [] as string[], municipios: [] as string[], bairro: "", cep: "", ddd: "",
  cnaes: [] as CnaeItem[], incluir_secundaria: false, natureza_juridica: "",
  situacoes: ["ATIVA"] as string[], portes: [] as string[],
  abertura_de: "", abertura_ate: "",
  capital_min: "", capital_max: "",
  somente_mei: false, excluir_mei: false,
  simples_optante: false, simples_excluir: false,
  com_email: false, com_telefone: true,
  somente_celular: false, somente_fixo: false, somente_matriz: false, somente_filial: false,
  excluir_email_contab: false,
}

function buildBody(form: typeof EMPTY_FORM, page: number) {
  const body: Record<string, unknown> = { limite: 20, pagina: page }
  if (form.termo.trim()) {
    body.busca_textual = [{ texto: [form.termo.trim()], tipo_busca: form.tipo_busca, razao_social: true, nome_fantasia: true, nome_socio: false }]
  }
  if (form.ufs.length)        body.uf        = form.ufs.map((u) => u.toLowerCase())
  if (form.municipios.length) body.municipio  = form.municipios.map((m) => m.toLowerCase())
  if (form.bairro.trim())     body.bairro     = [form.bairro.trim().toLowerCase()]
  if (form.cep.trim())        body.cep        = [form.cep.replace(/\D/g, "")]
  if (form.ddd.trim())        body.ddd        = [form.ddd.trim()]
  if (form.cnaes.length) {
    body.codigo_atividade_principal = form.cnaes.map((c) => stripCnae(c.codigo))
    if (form.incluir_secundaria) {
      body.incluir_atividade_secundaria = true
      body.codigo_atividade_secundaria  = form.cnaes.map((c) => stripCnae(c.codigo))
    }
  }
  if (form.natureza_juridica.trim()) body.codigo_natureza_juridica = form.natureza_juridica.split(",").map((c) => c.trim()).filter(Boolean)
  if (form.situacoes.length)  body.situacao_cadastral = form.situacoes
  if (form.somente_matriz)    body.matriz_filial = "MATRIZ"
  else if (form.somente_filial) body.matriz_filial = "FILIAL"
  if (form.portes.length)     body.porte_empresa = { codigos: form.portes }
  if (form.abertura_de || form.abertura_ate) {
    body.data_abertura = {
      ...(form.abertura_de && { inicio: form.abertura_de }),
      ...(form.abertura_ate && { fim: form.abertura_ate }),
    }
  }
  if (form.capital_min !== "" || form.capital_max !== "") {
    body.capital_social = {
      ...(form.capital_min !== "" && { minimo: Number(form.capital_min) }),
      ...(form.capital_max !== "" && { maximo: Number(form.capital_max) }),
    }
  }
  if (form.somente_mei || form.excluir_mei)         body.mei     = { optante: form.somente_mei,     excluir_optante: form.excluir_mei }
  if (form.simples_optante || form.simples_excluir) body.simples = { optante: form.simples_optante, excluir_optante: form.simples_excluir }
  const mf: Record<string, boolean> = {}
  if (form.com_email)            mf.com_email            = true
  if (form.com_telefone)         mf.com_telefone         = true
  if (form.somente_celular)      mf.somente_celular      = true
  if (form.somente_fixo)         mf.somente_fixo         = true
  if (form.excluir_email_contab) mf.excluir_email_contab = true
  if (Object.keys(mf).length)   body.mais_filtros        = mf
  return body
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCNPJ(raw: string) {
  const d = (raw || "").replace(/\D/g, "")
  if (d.length !== 14) return raw || ""
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}
function formatDate(d?: string) {
  if (!d) return "—"
  const p = d.slice(0, 10).split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
}
function sitColor(s?: string) {
  if (s === "ATIVA")   return "text-green-500"
  if (s === "BAIXADA") return "text-red-500"
  if (s === "INAPTA")  return "text-yellow-500"
  return "text-muted-foreground"
}

// ── UI atoms ──────────────────────────────────────────────────────────────────

function SectionTitle({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 pb-1.5 border-b border-border flex items-center gap-1.5">
      {children}
      {tooltip && <InfoTooltip text={tooltip} side="right" />}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!value)} className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer shrink-0 ${value ? "bg-green-500" : "bg-secondary"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </div>
      <span className={`text-xs ${value ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </label>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${active ? "bg-green-500 border-green-500 text-white font-semibold" : "bg-secondary border-border text-muted-foreground hover:border-green-500/50"}`}>
      {label}
    </button>
  )
}

// ── MultiPicker ───────────────────────────────────────────────────────────────

function MultiPicker<T>({
  value, onChange, items, loading, placeholder,
  getKey, getLabel, tagLabel,
}: {
  value: T[]; onChange: (v: T[]) => void; items: T[]; loading?: boolean;
  placeholder: string; getKey: (c: T) => string; getLabel: (c: T) => string; tagLabel?: (c: T) => string
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = (q ? items.filter((c) => getKey(c).toLowerCase().includes(q) || getLabel(c).toLowerCase().includes(q)) : items).slice(0, 80)

  function toggle(item: T) {
    const k = getKey(item)
    const exists = value.find((c) => getKey(c) === k)
    onChange(exists ? value.filter((c) => getKey(c) !== k) : [...value, item])
  }

  return (
    <div ref={ref} className="relative">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {value.map((c) => (
            <span key={getKey(c)} className="flex items-center gap-1 bg-green-500/10 text-green-500 rounded px-2 py-0.5 text-[11px] font-semibold">
              {tagLabel ? tagLabel(c) : getLabel(c)}
              <span onClick={() => onChange(value.filter((x) => getKey(x) !== getKey(c)))} className="cursor-pointer text-muted-foreground hover:text-foreground leading-none text-sm">×</span>
            </span>
          ))}
        </div>
      )}
      <Input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Carregando..." : placeholder}
        disabled={loading}
        className="bg-secondary text-sm h-8"
      />
      {open && !loading && (
        <div className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 && <div className="p-3 text-xs text-muted-foreground text-center">Nenhum resultado</div>}
          {filtered.map((c) => {
            const sel = !!value.find((x) => getKey(x) === getKey(c))
            return (
              <div key={getKey(c)} onClick={() => toggle(c)}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs border-b border-border/50 hover:bg-accent ${sel ? "bg-green-500/5" : ""}`}>
                <div className={`w-3.5 h-3.5 rounded shrink-0 border-2 flex items-center justify-center ${sel ? "border-green-500 bg-green-500" : "border-muted-foreground"}`}>
                  {sel && <span className="text-white text-[8px] font-bold">✓</span>}
                </div>
                <span className="font-mono text-green-500 shrink-0 min-w-[60px]">{getKey(c)}</span>
                <span className="text-foreground leading-tight">{getLabel(c)}</span>
              </div>
            )
          })}
          {!q && items.length > 80 && <div className="p-2 text-[11px] text-muted-foreground text-center">Digite para filtrar {items.length} opções</div>}
        </div>
      )}
    </div>
  )
}

function CnaePicker({ value, onChange }: { value: CnaeItem[]; onChange: (v: CnaeItem[]) => void }) {
  const [cnaes, setCnaes] = useState<CnaeItem[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (cnaeCache) { setCnaes(cnaeCache); return }
    setLoading(true)
    loadCnaes().then((data) => { setCnaes(data); setLoading(false) })
  }, [])
  return <MultiPicker value={value} onChange={onChange} items={cnaes} loading={loading} placeholder="Buscar por código ou descrição..." getKey={(c) => c.codigo} getLabel={(c) => c.descricao} tagLabel={(c) => c.codigo} />
}

function MunicipioPicker({ ufs, value, onChange }: { ufs: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [items, setItems] = useState<{ nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const ufsKey = ufs.join(",")
  useEffect(() => {
    if (!ufs.length) { setItems([]); onChange([]); return }
    setLoading(true)
    loadMunicipios(ufs).then((names) => {
      setItems(names.map((n) => ({ nome: n })))
      onChange(value.filter((v) => names.includes(v)))
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ufsKey])
  if (!ufs.length) return <p className="text-xs text-muted-foreground py-1">Selecione um estado primeiro</p>
  return (
    <MultiPicker
      value={value.map((n) => ({ nome: n }))}
      onChange={(v) => onChange(v.map((x) => x.nome))}
      items={items} loading={loading} placeholder="Buscar município..."
      getKey={(c) => c.nome} getLabel={(c) => c.nome}
    />
  )
}

// ── Props / component ─────────────────────────────────────────────────────────

interface GeradorCasaDadosProps {
  currentCredits: number
  onLeadsGenerated: () => void
  onAlert: (alert: { type: "success" | "error" | "warning" | "info"; title: string; message: string }) => void
  existingCnpjs?: string[]
}

type CddItem = Record<string, unknown>

export function GeradorCasaDados({ currentCredits, onLeadsGenerated, onAlert, existingCnpjs = [] }: GeradorCasaDadosProps) {
  const [form, setForm]       = useState(EMPTY_FORM)
  const [results, setResults] = useState<CddItem[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [saved, setSaved]     = useState<Record<string, boolean>>({})
  const [saving, setSaving]   = useState<Record<string, boolean>>({})
  const [savingAll, setSavingAll]     = useState(false)
  const [saveAllProgress, setSaveAllProgress] = useState<{ done: number; total: number } | null>(null)
  const cancelRef = useRef(false)

  function set<K extends keyof typeof EMPTY_FORM>(field: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const inDb = useCallback((cnpj: string) => existingCnpjs.includes((cnpj || "").replace(/\D/g, "")), [existingCnpjs])

  async function fetchPage(p: number, formArg = form) {
    const res = await fetch("/api/gerar-leads/casa-dos-dados/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(formArg, p)),
    })
    if (!res.ok) { const t = await res.json(); throw new Error(t.error || `Erro ${res.status}`) }
    const json = await res.json()
    return { cnpjs: (json?.cnpjs || []) as CddItem[], total: (json?.total || 0) as number }
  }

  async function search(p = 1) {
    setLoading(true); setError(""); setPage(p)
    try {
      const { cnpjs, total: t } = await fetchPage(p)
      setResults(cnpjs); setTotal(t)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao consultar a API"
      setError(msg); setResults([]); setTotal(0)
    } finally { setLoading(false) }
  }

  async function saveItems(items: CddItem[]) {
    const res = await fetch("/api/gerar-leads/casa-dos-dados/salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Erro ao salvar")
    return json as { saved: number; duplicatesSkipped: number; creditsUsed: number }
  }

  async function saveOne(item: CddItem) {
    const key = item.cnpj as string
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      await saveItems([item])
      setSaved((prev) => ({ ...prev, [key]: true }))
      onLeadsGenerated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function saveAll() {
    const totalPages = Math.ceil(total / 20)
    cancelRef.current = false; setSavingAll(true); setSaveAllProgress({ done: 0, total })
    try {
      for (let p = 1; p <= totalPages; p++) {
        if (cancelRef.current) break
        const items = p === page ? results : (await fetchPage(p)).cnpjs
        const toSave = items.filter((item) => {
          const cnpj = item.cnpj as string
          return !inDb(cnpj) && !saved[cnpj]
        })
        if (toSave.length) {
          const r = await saveItems(toSave)
          toSave.forEach((item) => setSaved((prev) => ({ ...prev, [item.cnpj as string]: true })))
          if (r.creditsUsed > 0) onLeadsGenerated()
        }
        setSaveAllProgress((prev) => prev ? { ...prev, done: prev.done + items.length } : null)
      }
      toast.success("Importação concluída!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally { cancelRef.current = false; setSavingAll(false); setSaveAllProgress(null) }
  }

  const totalPages = Math.ceil(total / 20) || 0

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); search(1) }} className="space-y-4">

        {/* Localização */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <SectionTitle tooltip="Filtre por estado e município. Selecione um ou mais estados para habilitar a busca por município. O DDD filtra empresas com telefone daquele código de área.">Localização</SectionTitle>
          <div>
            <p className="text-xs font-medium text-card-foreground mb-1.5">Estado (UF)</p>
            <div className="flex flex-wrap gap-1">
              {UF_LIST.map((uf) => (
                <Chip key={uf} label={uf} active={form.ufs.includes(uf)}
                  onClick={() => set("ufs", form.ufs.includes(uf) ? form.ufs.filter((u) => u !== uf) : [...form.ufs, uf])} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-card-foreground mb-1.5">
                Município {form.ufs.length > 0 && `(${form.ufs.join(", ")})`}
              </p>
              <MunicipioPicker ufs={form.ufs} value={form.municipios} onChange={(v) => set("municipios", v)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-card-foreground mb-1.5">CEP</p>
                <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" className="bg-secondary h-8 text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-card-foreground mb-1.5">DDD</p>
                <Input value={form.ddd} onChange={(e) => set("ddd", e.target.value)} placeholder="11" className="bg-secondary h-8 text-sm" maxLength={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Busca textual */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
          <SectionTitle tooltip="Busca pelo nome da empresa na base da Receita Federal. 'Radical' encontra variações da palavra (ex: 'constru' encontra construtora, construção). 'Exata' exige a palavra completa.">Busca Textual</SectionTitle>
          <Input value={form.termo} onChange={(e) => set("termo", e.target.value)}
            placeholder="Ex: restaurante, clínica, construtora..." className="bg-secondary text-sm h-8" />
          <div className="flex gap-2">
            <Chip label="Radical" active={form.tipo_busca === "radical"} onClick={() => set("tipo_busca", "radical")} />
            <Chip label="Exata"   active={form.tipo_busca === "exata"}   onClick={() => set("tipo_busca", "exata")} />
          </div>
        </div>

        {/* CNAE */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
          <SectionTitle tooltip="CNAE é o código de atividade econômica da empresa na Receita Federal. Ex: 6201-5/01 = Desenvolvimento de programas de computador. Você pode selecionar múltiplos CNAEs. Ative 'incluir secundários' para pegar empresas que exercem essa atividade como secundária também.">Atividade (CNAE)</SectionTitle>
          <CnaePicker value={form.cnaes} onChange={(v) => set("cnaes", v)} />
          {form.cnaes.length > 0 && (
            <Toggle label="Incluir CNAEs secundários" value={form.incluir_secundaria} onChange={(v) => set("incluir_secundaria", v)} />
          )}
        </div>

        {/* Empresa */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <SectionTitle tooltip="Filtre por características da empresa. 'Ativa' é o mais comum para prospecção. Natureza jurídica aceita código numérico (ex: 2062 = Sociedade Limitada). Capital social filtra pelo valor declarado na Receita.">Empresa</SectionTitle>
          <div>
            <p className="text-xs font-medium text-card-foreground mb-1.5">Situação</p>
            <div className="flex flex-wrap gap-1">
              {SITUACOES.map((s) => (
                <Chip key={s} label={s} active={form.situacoes.includes(s)}
                  onClick={() => set("situacoes", form.situacoes.includes(s) ? form.situacoes.filter((x) => x !== s) : [...form.situacoes, s])} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-card-foreground mb-1.5">Porte</p>
            <div className="flex gap-2">
              {PORTES.map((p) => (
                <Chip key={p.value} label={p.label} active={form.portes.includes(p.value)}
                  onClick={() => set("portes", form.portes.includes(p.value) ? form.portes.filter((v) => v !== p.value) : [...form.portes, p.value])} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-card-foreground mb-1.5">Natureza Jurídica (código)</p>
            <Input value={form.natureza_juridica} onChange={(e) => set("natureza_juridica", e.target.value)}
              placeholder="Ex: 2011, 2062" className="bg-secondary text-sm h-8" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-medium text-card-foreground mb-1.5">Abertura: De</p>
              <Input type="date" value={form.abertura_de} onChange={(e) => set("abertura_de", e.target.value)} className="bg-secondary text-sm h-8" />
            </div>
            <div>
              <p className="text-xs font-medium text-card-foreground mb-1.5">Abertura: Até</p>
              <Input type="date" value={form.abertura_ate} onChange={(e) => set("abertura_ate", e.target.value)} className="bg-secondary text-sm h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-medium text-card-foreground mb-1.5">Capital Mín. (R$)</p>
              <Input type="number" value={form.capital_min} onChange={(e) => set("capital_min", e.target.value)} placeholder="0" className="bg-secondary text-sm h-8" />
            </div>
            <div>
              <p className="text-xs font-medium text-card-foreground mb-1.5">Capital Máx. (R$)</p>
              <Input type="number" value={form.capital_max} onChange={(e) => set("capital_max", e.target.value)} placeholder="ilimitado" className="bg-secondary text-sm h-8" />
            </div>
          </div>
        </div>

        {/* Filtros adicionais */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <SectionTitle tooltip="Filtros de qualidade dos leads. 'Excluir e-mail contab.' remove endereços genéricos de escritórios contábeis (ex: contato@escritoriocontabil.com). MEI e Simples filtram pelo regime tributário da empresa.">Filtros Adicionais</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Contato</p>
              <Toggle label="Com e-mail"  value={form.com_email}  onChange={(v) => set("com_email", v)} />
              <Toggle label="Com telefone" value={form.com_telefone} onChange={(v) => { set("com_telefone", v); if (!v) { set("somente_celular", false); set("somente_fixo", false) } }} />
              <Toggle label="Somente celular" value={form.somente_celular} onChange={(v) => { set("somente_celular", v); if (v) { set("com_telefone", true); set("somente_fixo", false) } }} />
              <Toggle label="Somente fixo"    value={form.somente_fixo}    onChange={(v) => { set("somente_fixo", v);    if (v) { set("com_telefone", true); set("somente_celular", false) } }} />
              <Toggle label="Excluir e-mail contab." value={form.excluir_email_contab} onChange={(v) => set("excluir_email_contab", v)} />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">MEI</p>
                <Toggle label="Somente MEI" value={form.somente_mei} onChange={(v) => { set("somente_mei", v); if (v) set("excluir_mei", false) }} />
                <Toggle label="Excluir MEI"  value={form.excluir_mei}  onChange={(v) => { set("excluir_mei", v);  if (v) set("somente_mei", false) }} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Simples Nacional</p>
                <Toggle label="Optante do Simples" value={form.simples_optante} onChange={(v) => { set("simples_optante", v); if (v) set("simples_excluir", false) }} />
                <Toggle label="Excluir optantes"   value={form.simples_excluir} onChange={(v) => { set("simples_excluir", v); if (v) set("simples_optante", false) }} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Estabelecimento</p>
                <Toggle label="Somente matriz" value={form.somente_matriz} onChange={(v) => { set("somente_matriz", v); if (v) set("somente_filial", false) }} />
                <Toggle label="Somente filial"  value={form.somente_filial}  onChange={(v) => { set("somente_filial", v);  if (v) set("somente_matriz", false) }} />
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            {loading ? "Buscando..." : "🔍 Buscar empresas"}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setForm(EMPTY_FORM); setResults([]); setTotal(0); setError("") }}>
            Limpar
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{total.toLocaleString("pt-BR")}</span> resultado{total !== 1 ? "s" : ""} · página {page}/{totalPages}
            </div>
            <div className="flex gap-2">
              {savingAll ? (
                <>
                  <span className="text-xs text-muted-foreground self-center">
                    Salvando... ({saveAllProgress?.done ?? 0}/{saveAllProgress?.total ?? total})
                  </span>
                  <Button size="sm" variant="outline" onClick={() => { cancelRef.current = true }}>Cancelar</Button>
                </>
              ) : (
                <Button size="sm" onClick={saveAll} className="bg-blue-600 hover:bg-blue-700 text-white">
                  + Salvar todos ({total.toLocaleString("pt-BR")})
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  {["CNPJ","Razão Social","Nome Fantasia","Município/UF","Segmento","Telefone","E-mail","Abertura","Situação","Ação"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((item, i) => {
                  const cnpj     = item.cnpj as string || ""
                  const already  = inDb(cnpj)
                  const wasSaved = saved[cnpj]
                  const isSaving = saving[cnpj]
                  const done     = already || wasSaved
                  const end      = item.endereco as Record<string, unknown> | undefined
                  const tel      = (item.contato_telefonico as Record<string, unknown>[] | undefined)?.[0]
                  const email    = (item.contato_email as Record<string, unknown>[] | undefined)?.[0]
                  const cnae     = item.atividade_principal as Record<string, unknown> | undefined
                  const sit      = (item.situacao_cadastral as Record<string, unknown> | undefined)
                  const sitStr   = (sit?.situacao_atual || sit?.situacao_cadastral || "—") as string
                  return (
                    <tr key={cnpj || i} className={`border-b border-border/50 ${done ? "bg-green-500/5" : "bg-background"}`}>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{formatCNPJ(cnpj)}</td>
                      <td className="px-3 py-2 max-w-[160px] truncate">{(item.razao_social as string) || "—"}</td>
                      <td className="px-3 py-2 max-w-[120px] truncate text-muted-foreground">{(item.nome_fantasia as string) || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{[end?.municipio, end?.uf].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate text-muted-foreground">{(cnae?.descricao as string) || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{(tel?.completo as string) || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate text-muted-foreground">{(email?.email as string)?.toLowerCase() || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDate(item.data_abertura as string)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-[10px] font-bold ${sitColor(sitStr)}`}>{sitStr}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {done ? (
                          <span className="text-green-500 font-semibold">✓ {already && !wasSaved ? "Já existe" : "Salvo"}</span>
                        ) : (
                          <Button size="sm" onClick={() => saveOne(item)} disabled={isSaving}
                            className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white">
                            {isSaving ? "..." : "+ Salvar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" onClick={() => search(page - 1)} disabled={page <= 1 || loading}>← Anterior</Button>
              <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => search(page + 1)} disabled={page >= totalPages || loading}>Próximo →</Button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length === 0 && total === 0 && !error && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">🔍</div>
          Preencha os filtros e clique em Buscar para encontrar empresas.
        </div>
      )}
    </div>
  )
}
