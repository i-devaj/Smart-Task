import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]

type RouteContext = {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getSupabaseServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to read session", details: sessionError.message },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const { data, error } = await supabase
      .from("evaluations")
      .update({ is_paid: true })
      .eq("id", params.id)
      .eq("user_id", userId)
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
