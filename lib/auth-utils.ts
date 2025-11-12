import { createClient } from "@/lib/supabase/server"

export async function getUserRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: usuario } = await supabase.from("usuarios").select("role").eq("id", user.id).single()

  return {
    user,
    role: usuario?.role || "user",
    isSuperAdmin: usuario?.role === "super_admin",
    isAdmin: usuario?.role === "admin" || usuario?.role === "super_admin",
  }
}

export async function requireSuperAdmin() {
  const authData = await getUserRole()

  if (!authData || !authData.isSuperAdmin) {
    throw new Error("Acesso negado: apenas super administradores")
  }

  return authData
}
