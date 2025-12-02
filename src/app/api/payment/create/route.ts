import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]
// We don't need PaymentRow here for the insert typing, Supabase infers it

const bodySchema = z.object({
  evaluationId: z.string().min(1, "evaluationId is required"),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { evaluationId } = parsed.data

    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Check if evaluation exists and belongs to user (via task)
    // Since evaluations table doesn't have user_id, we check if the user owns the TASK linked to it.
    // However, for simplicity in this payment initiation, we can check if the user is authorized.
    // The RLS policy we added "Allow select for task owners" will handle the permission check implicitly.
    const { data: evaluation, error: evaluationError } = await supabase
      .from("evaluations")
      .select("id, is_paid")
      .eq("id", evaluationId)
      .single<EvaluationRow>()

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found or access denied" },
        { status: 404 }
      )
    }

    if (evaluation.is_paid) {
      return NextResponse.json({ error: "Report is already unlocked" }, { status: 400 })
    }

    // 2. Generate a fake session ID for this demo
    const providerSessionId = `demo_sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const amount = 99
    const currency = "INR"

    // 3. Create Payment Record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        evaluation_id: evaluation.id,
        user_id: user.id,
        amount,
        currency,
        status: "pending",
        provider_session_id: providerSessionId,
      })
      .select("id, status")
      .single()

    if (paymentError || !payment) {
      console.error("Payment Creation Error:", paymentError)
      return NextResponse.json(
        { error: "Failed to initialize payment", details: paymentError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentId: payment.id,
      evaluationId: evaluation.id,
      amount,
      currency,
      status: payment.status,
      providerSessionId, // Used by frontend to verify later
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}