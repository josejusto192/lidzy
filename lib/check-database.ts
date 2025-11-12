import { createClient } from "@/lib/supabase/server"

export async function checkDatabaseSetup() {
  try {
    const supabase = await createClient()

    // Try to query the contatos table to see if it exists
    const { error } = await supabase.from("contatos").select("id").limit(1)

    // PGRST205 is the error code for table not found
    if (error && error.code === "PGRST205") {
      return {
        isSetup: false,
        error: "DATABASE_NOT_SETUP",
        message: "As tabelas do banco de dados ainda não foram criadas.",
      }
    }

    if (error) {
      return {
        isSetup: false,
        error: "DATABASE_ERROR",
        message: error.message,
      }
    }

    return {
      isSetup: true,
      error: null,
      message: null,
    }
  } catch (error) {
    return {
      isSetup: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
