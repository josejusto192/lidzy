"use client"

import { useState } from "react"
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Papa from "papaparse"

type ImportResult = {
  total: number
  success: number
  errors: Array<{ row: number; error: string }>
}

export function ContactImport({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Por favor, selecione um arquivo CSV")
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro")
      return
    }

    setImporting(true)

    try {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const contacts = results.data as Array<Record<string, string>>

          if (contacts.length === 0) {
            toast.error("O arquivo CSV está vazio")
            setImporting(false)
            return
          }

          // Send to API
          const response = await fetch("/api/contatos/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ contacts }),
          })

          const data = await response.json()

          if (response.ok) {
            setResult(data)
            toast.success(`${data.success} contatos importados com sucesso!`)

            if (data.errors.length > 0) {
              toast.warning(`${data.errors.length} contatos com erro`)
            }

            if (onSuccess) {
              setTimeout(() => {
                onSuccess()
                setOpen(false)
              }, 2000)
            }
          } else {
            toast.error(data.error || "Erro ao importar contatos")
          }
        },
        error: (error) => {
          toast.error("Erro ao ler o arquivo CSV")
          console.error(error)
        },
      })
    } catch (error) {
      toast.error("Erro ao importar contatos")
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `nome,email,telefone,empresa,cargo,cidade,estado,pais,tags
João Silva,joao@example.com,11999999999,Empresa ABC,Gerente,São Paulo,SP,Brasil,cliente;vip
Maria Santos,maria@example.com,11988888888,Empresa XYZ,Diretora,Rio de Janeiro,RJ,Brasil,prospect`

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "modelo-importacao-contatos.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Template baixado!")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            Importe seus contatos de um arquivo CSV. Baixe o modelo para ver o formato correto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Baixe o modelo de importação:</p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique para escolher outro arquivo
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Selecione um arquivo CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
              )}
            </label>
          </div>

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {result.success} de {result.total} contatos importados
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Erros encontrados:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        Linha {err.row}: {err.error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-sm text-muted-foreground font-medium">
                        ... e mais {result.errors.length - 5} erros
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? "Importando..." : "Importar Contatos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
