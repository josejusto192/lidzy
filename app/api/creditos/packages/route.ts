import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - List available credit packages
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: packages, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("ativo", true)
      .order("preco", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching packages:", error)
      return NextResponse.json({ error: "Erro ao buscar pacotes" }, { status: 500 })
    }

    // Calculate total credits with bonus
    const packagesWithBonus = packages.map((pkg) => ({
      ...pkg,
      creditos_total: pkg.creditos + Math.floor((pkg.creditos * pkg.bonus_percentage) / 100),
      preco_por_credito: (pkg.preco / pkg.creditos).toFixed(4),
    }))

    return NextResponse.json({ packages: packagesWithBonus })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
