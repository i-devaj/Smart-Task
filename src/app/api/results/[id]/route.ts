import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        { error: "Failed to read user", details: userError.message },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const { data, error } = await supabase
      .from("evaluations")
      .select("id, task_id, user_id, created_at, is_paid, result, tasks(title)")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Evaluation not found", details: error?.message },
        { status: 404 }
      )
    }

    const row = data as any
    const result = (row.result ?? {}) as {
      score?: number
      summary?: string
      recommendations?: string[]
    }

    const payload = {
      id: row.id as EvaluationRow["id"],
      createdAt: row.created_at as EvaluationRow["created_at"],
      isPaid: (row.is_paid as EvaluationRow["is_paid"]) ?? false,
      taskTitle: (row.tasks as Pick<TaskRow, "title"> | null)?.title ?? "Untitled task",
      score: typeof result.score === "number" ? result.score : null,
      summary:
        typeof result.summary === "string" ? result.summary : "No summary available.",
      recommendations: Array.isArray(result.recommendations)
        ? result.recommendations.filter((r): r is string => typeof r === "string")
        : [],
    }

    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}
