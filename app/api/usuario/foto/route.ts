import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando upload de foto...")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    console.log("[v0] Usuário autenticado:", user.id)

    let formData: FormData
    try {
      formData = await request.formData()
      console.log("[v0] FormData recebido")
    } catch (error) {
      console.error("[v0] Erro ao processar FormData:", error)
      return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 400 })
    }

    const file = formData.get("file")
    console.log("[v0] Arquivo extraído:", file ? "sim" : "não")

    if (!file || !(file instanceof File)) {
      console.error("[v0] Arquivo inválido ou não encontrado")
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    console.log("[v0] Tipo do arquivo:", file.type, "Tamanho:", file.size)

    // Valida tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 })
    }

    // Valida tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande (máx 5MB)" }, { status: 400 })
    }

    // Busca foto antiga para deletar
    const { data: usuario } = await supabase.from("usuarios").select("foto_perfil").eq("id", user.id).single()

    // Gera nome único para o arquivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `perfil/${fileName}`

    console.log("[v0] Caminho do arquivo:", filePath)

    const arrayBuffer = await file.arrayBuffer()

    console.log("[v0] ArrayBuffer criado, tamanho:", arrayBuffer.byteLength)

    // Upload para Supabase Storage usando ArrayBuffer diretamente
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Erro no upload:", uploadError)
      return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 })
    }

    console.log("[v0] Upload concluído:", uploadData)

    // Gera URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    console.log("[v0] URL pública gerada:", publicUrl)

    // Atualiza no banco
    const { error: updateError } = await supabase.from("usuarios").update({ foto_perfil: publicUrl }).eq("id", user.id)

    if (updateError) {
      console.error("[v0] Erro ao atualizar banco:", updateError)
      // Se falhar, deleta o arquivo
      await supabase.storage.from("avatars").remove([filePath])
      throw updateError
    }

    console.log("[v0] Banco atualizado com sucesso")

    // Deleta foto antiga se existir
    if (usuario?.foto_perfil) {
      try {
        const oldPath = usuario.foto_perfil.split("/avatars/")[1]
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath])
          console.log("[v0] Foto antiga removida:", oldPath)
        }
      } catch (e) {
        console.error("[v0] Erro ao deletar foto antiga:", e)
      }
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("[v0] Erro geral ao fazer upload da foto:", error)
    return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Busca foto atual
    const { data: usuario } = await supabase.from("usuarios").select("foto_perfil").eq("id", user.id).single()

    if (!usuario?.foto_perfil) {
      return NextResponse.json({ error: "Nenhuma foto para remover" }, { status: 400 })
    }

    try {
      const filePath = usuario.foto_perfil.split("/avatars/")[1]
      if (filePath) {
        await supabase.storage.from("avatars").remove([filePath])
        console.log("[v0] Foto removida do storage:", filePath)
      }
    } catch (e) {
      console.error("[v0] Erro ao remover do storage:", e)
    }

    // Remove do banco
    await supabase.from("usuarios").update({ foto_perfil: null }).eq("id", user.id)

    console.log("[v0] Foto removida do banco com sucesso")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro geral ao remover foto:", error)
    return NextResponse.json({ error: "Erro ao remover foto" }, { status: 500 })
  }
}
