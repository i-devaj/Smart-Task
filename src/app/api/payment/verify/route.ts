import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"]
type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]

const bodySchema = z.object({
  paymentId: z.string().min(1, "paymentId is required"),
  success: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { paymentId, success } = parsed.data

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

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", userId)
      .single<PaymentRow>()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found", details: paymentError?.message },
        { status: 404 }
      )
    }

    const newStatus = success ? "success" : "failed"

    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({ status: newStatus })
      .eq("id", paymentId)
      .eq("user_id", userId)
      .select("id, status, evaluation_id")
      .single<PaymentRow>()

    if (updateError || !updatedPayment) {
      return NextResponse.json(
        { error: "Failed to update payment status", details: updateError?.message },
        { status: 500 }
      )
    }

    let evaluation: EvaluationRow | null = null

    if (success) {
      const { data: evaluationRow, error: evaluationError } = await supabase
        .from("evaluations")
        .update({ is_paid: true })
        .eq("id", updatedPayment.evaluation_id)
        .eq("user_id", userId)
        .select("id, task_id, user_id, result, created_at, is_paid")
        .single<EvaluationRow>()

      if (evaluationError || !evaluationRow) {
        return NextResponse.json(
          {
            error: "Payment verified but failed to unlock evaluation",
            details: evaluationError?.message,
          },
          { status: 500 }
        )
      }

      evaluation = evaluationRow
    }

    return NextResponse.json({
      status: newStatus,
      paymentId: updatedPayment.id,
      evaluationId: updatedPayment.evaluation_id,
      unlocked: success,
      evaluation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}
