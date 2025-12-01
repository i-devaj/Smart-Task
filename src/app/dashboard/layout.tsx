import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return <DashboardShell userEmail={session.user.email ?? null}>{children}</DashboardShell>
}


