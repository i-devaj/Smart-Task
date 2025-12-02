import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"]
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"]

const bodySchema = z.object({
  evaluationId: z.string().min(1, "evaluationId is required"),
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

    const { evaluationId } = parsed.data

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

    // Ensure evaluation belongs to current user and is not already paid
    const { data: evaluation, error: evaluationError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .eq("user_id", userId)
      .single<EvaluationRow>()

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found", details: evaluationError?.message },
        { status: 404 }
      )
    }

    if (evaluation.is_paid) {
      return NextResponse.json(
        { error: "Evaluation already unlocked" },
        { status: 400 }
      )
    }

    const providerSessionId =
      (globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2)) ?? undefined

    const amount = 99
    const currency = "INR"

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        evaluation_id: evaluation.id,
        user_id: userId,
        amount,
        currency,
        status: "pending",
        provider_session_id: providerSessionId,
      })
      .select("id, status, amount, currency, provider_session_id")
      .single<PaymentRow>()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Failed to initialize payment", details: paymentError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentId: payment.id,
      evaluationId: evaluation.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      providerSessionId: payment.provider_session_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}
