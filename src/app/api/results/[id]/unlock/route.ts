import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    // FIX: Await params here too
    const { id } = await params

    const supabase = await getSupabaseServerClient()
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

    // Since evaluations table doesn't have user_id, we should ideally verify ownership via tasks join.
    // However, for the update, we can rely on the RLS policy "Allow update for task owners" 
    // which we added earlier.
    const { data, error } = await supabase
      .from("evaluations")
      .update({ is_paid: true })
      .eq("id", id)
      // Note: RLS will ensure the user owns the task linked to this evaluation
      .select("id, is_paid")
      .single<EvaluationRow>()

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to unlock report", details: error?.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ id: data.id, isPaid: data.is_paid ?? true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}