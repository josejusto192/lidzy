import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("conversas")
      .update({ contato_id: body.contato_id })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating conversa:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/conversas/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
