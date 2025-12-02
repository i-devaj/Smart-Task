import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Fetch Active Tasks Count
  // We assume 'pending' tasks are active.
  const { count: activeTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending")

  // 2. Fetch Evaluations for Report Stats
  // We join with 'tasks' to ensure we only get evaluations belonging to this user
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(`
      score,
      created_at,
      tasks!inner ( user_id )
    `)
    .eq("tasks.user_id", user.id)

  // Calculate "Reports this week"
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const reportsThisWeek = (evaluations ?? []).filter(
    (e) => new Date(e.created_at) > oneWeekAgo
  ).length

  // Calculate "Average Score"
  const totalScore = (evaluations ?? []).reduce(
    (sum, curr) => sum + (curr.score ?? 0), 
    0
  )
  const avgScore = evaluations?.length 
    ? Math.round(totalScore / evaluations.length) 
    : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Quick overview of your tasks and recent evaluation reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Active tasks</p>
          <p className="mt-2 text-3xl font-semibold">
            {activeTasksCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Reports this week</p>
          <p className="mt-2 text-3xl font-semibold">
            {reportsThisWeek}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Average score</p>
          <p className="mt-2 text-3xl font-semibold">
            {avgScore !== null ? avgScore : "–"}
          </p>
        </div>
      </div>
    </div>
  )
}