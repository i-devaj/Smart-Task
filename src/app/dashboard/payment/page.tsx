import Link from "next/link"

export default function PaymentPage({
  searchParams,
}: {
  searchParams: { status?: string; evaluationId?: string }
}) {
  const status = searchParams.status ?? ""
  const evaluationId = searchParams.evaluationId ?? ""

  const isSuccess = status === "success"
  const isFailure = status === "failed" || status === "error"

  const heading = isSuccess
    ? "Payment successful"
    : isFailure
    ? "Payment failed"
    : "Payment status"

  const description = isSuccess
    ? "Your payment was processed and the report should now be unlocked."
    : isFailure
    ? "We could not complete your payment. You can try again from the report page."
    : "We could not determine the payment status."

  const targetHref = evaluationId
    ? `/dashboard/results/${evaluationId}`
    : "/dashboard/past-reports"

  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card/70 px-6 py-8 text-center shadow-lg">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            If the status looks wrong, refresh the report page or try unlocking again.
          </p>
        </div>

        <div className="pt-1">
          <Link
            href={targetHref}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go back
          </Link>
        </div>
      </div>
    </div>
  )
}
