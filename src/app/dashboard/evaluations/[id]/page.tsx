import Link from "next/link"
import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

type PageProps = {
  params: {
    id: string
  }
}

export default async function EvaluationResultPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Dashboard layout should already handle auth, but guard just in case
    notFound()
  }

  const userId = session.user.id

  const { data: evaluation, error: evaluationError } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single<EvaluationRow>()

  if (evaluationError || !evaluation) {
    notFound()
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", evaluation.task_id)
    .single<TaskRow>()

  if (taskError || !task) {
    notFound()
  }

  const result = (evaluation.result ?? {}) as {
    score?: number
    summary?: string
    recommendations?: string[]
  }

  const score = typeof result.score === "number" ? result.score : undefined
  const summary = typeof result.summary === "string" ? result.summary : "No summary available."
  const recommendations = Array.isArray(result.recommendations)
    ? result.recommendations.filter((r): r is string => typeof r === "string")
    : []

  const createdAt = new Date(evaluation.created_at)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluation Result</h1>
          <p className="text-sm text-muted-foreground">
            Generated for: <span className="font-medium">{task.title}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Created at {createdAt.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/past-reports">
            <Button variant="outline" size="sm">
              Past reports
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,_2fr)_minmax(0,_3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Score</CardTitle>
            <CardDescription>
              Overall clarity and feasibility of this task.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold">
                {typeof score === "number" ? Math.round(score) : "–"}
              </span>
              {typeof score === "number" && (
                <span className="text-sm text-muted-foreground">/ 100</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              High-level feedback from the evaluator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {summary}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Concrete suggestions for improving this task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No structured recommendations were returned.
            </p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
