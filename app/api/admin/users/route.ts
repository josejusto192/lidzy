import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth-utils"

export async function GET() {
  try {
    await requireSuperAdmin()

    const supabase = await createClient()

    const { data: usuarios, error: usuariosError } = await supabase
      .from("usuarios")
      .select("*")
      .order("criado_em", { ascending: false })

    if (usuariosError) {
      console.error("[v0] Erro ao buscar usuários:", usuariosError)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }

    // Buscar assinaturas e planos para cada usuário
    const usuariosComAssinatura = await Promise.all(
      usuarios.map(async (usuario) => {
        if (usuario.assinatura_id) {
          const { data: assinatura } = await supabase
            .from("assinaturas")
            .select(`
              *,
              planos (*)
            `)
            .eq("id", usuario.assinatura_id)
            .single()

          return {
            ...usuario,
            assinatura,
          }
        }
        return {
          ...usuario,
          assinatura: null,
        }
      }),
    )

    return NextResponse.json({ usuarios: usuariosComAssinatura })
  } catch (error: any) {
    console.error("[v0] Erro ao buscar usuários:", error.message)
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
