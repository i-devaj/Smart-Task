import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // FIX: Await params before accessing .id
    const { id } = await params
    
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Join 'tasks' to verify ownership
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        created_at,
        is_paid,
        score,
        strengths,
        improvements,
        full_reports,
        tasks!inner ( title, user_id )
      `)
      .eq("id", id)
      .eq("tasks.user_id", user.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Evaluation not found", details: error?.message },
        { status: 404 }
      )
    }

    const row = data as any
    const task = row.tasks as { title: string }

    const payload = {
      id: row.id,
      createdAt: row.created_at,
      isPaid: row.is_paid ?? false,
      taskTitle: task.title ?? "Untitled task",
      score: row.score,
      summary: row.full_reports ?? "No summary available.",
      recommendations: Array.isArray(row.improvements)
        ? row.improvements.map((r: any) => String(r))
        : [],
      strengths: Array.isArray(row.strengths)
        ? row.strengths.map((r: any) => String(r))
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