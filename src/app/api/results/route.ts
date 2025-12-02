import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

export async function GET() {
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to load evaluations", details: error.message },
        { status: 500 }
      )
    }

    const items = (data ?? []).map((row: any) => {
      const result = (row.result ?? {}) as {
        score?: number
        summary?: string
      }

      return {
        id: row.id as EvaluationRow["id"],
        createdAt: row.created_at as EvaluationRow["created_at"],
        isPaid: (row.is_paid as EvaluationRow["is_paid"]) ?? false,
        taskTitle: (row.tasks as Pick<TaskRow, "title"> | null)?.title ?? "Untitled task",
        score: typeof result.score === "number" ? result.score : null,
        summary:
          typeof result.summary === "string" ? result.summary : "No summary available.",
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}
