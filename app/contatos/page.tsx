"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DashboardContent } from "@/components/dashboard-content"
import { OnboardingModal } from "@/components/onboarding-modal"
import { ReferralBanner } from "@/components/referral-banner"
import { createClient } from "@/lib/supabase/client"

export default function ContatosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-16 lg:pl-52 lg:pt-0">
        <Header title="Contatos" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <OnboardingModal />
          <ReferralBanner />
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}
