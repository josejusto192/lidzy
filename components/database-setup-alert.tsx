"use client"

import { AlertCircle, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function DatabaseSetupAlert() {
  return (
    <Alert className="border-orange-500/50 bg-orange-500/10">
      <AlertCircle className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-lg font-semibold text-orange-500">Banco de Dados Não Configurado</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm text-muted-foreground">
          As tabelas do banco de dados ainda não foram criadas. Para usar o sistema, você precisa executar o script SQL
          de configuração.
        </p>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-card-foreground">Como Configurar:</h4>
          </div>
          <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>
              Localize o arquivo{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                scripts/001_create_tables.sql
              </code>
            </li>
            <li>
              Clique no botão <strong>"Run Script"</strong> para executar o script
            </li>
            <li>Aguarde a confirmação de que as tabelas foram criadas</li>
            <li>Recarregue esta página para começar a usar o sistema</li>
          </ol>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-orange-500 hover:bg-orange-500/10"
          >
            Recarregar Página
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
