"use client"

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export type UnlockReportButtonProps = {
  evaluationId: string
  isPaid: boolean
  onUnlocked?: () => void
}

export function UnlockReportButton({ evaluationId, isPaid, onUnlocked }: UnlockReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"idle" | "creating" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const isBusy = step === "creating" || step === "verifying"

  const handlePrimaryClick = () => {
    if (isPaid) return
    setIsOpen(true)
    setStep("idle")
    setError(null)
  }

  const handleClose = () => {
    if (isBusy) return
    setIsOpen(false)
    setStep("idle")
    setError(null)
  }

  const handleConfirm = async () => {
    if (isBusy) return
    setError(null)

    try {
      setStep("creating")

      const createResponse = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ evaluationId }),
      })

      const createJson = await createResponse.json()

      if (!createResponse.ok || !createJson?.paymentId) {
        throw new Error(createJson?.error ?? "Failed to initialize payment")
      }

      const paymentId: string = createJson.paymentId

      setStep("verifying")

      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId, success: true }),
      })

      const verifyJson = await verifyResponse.json()

      if (!verifyResponse.ok || verifyJson?.status !== "success") {
        throw new Error(verifyJson?.error ?? "Payment verification failed")
      }

      setStep("success")
      onUnlocked?.()

      // Give a brief success moment, then close the modal
      setTimeout(() => {
        setIsOpen(false)
        setStep("idle")
      }, 900)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      setError(message)
      setStep("error")
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.45)] hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-default disabled:opacity-80"
        onClick={handlePrimaryClick}
        disabled={isPaid}
      >
        {isPaid ? (
          "Full report unlocked"
        ) : (
          <>
            <Lock className="h-3 w-3" />
            Unlock full report
            <span className="ml-1 text-[11px] font-semibold">Rs 99</span>
          </>
        )}
      </Button>

      {isOpen && !isPaid && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -left-16 top-[-80px] h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl" />
              <div className="absolute -right-10 bottom-[-80px] h-48 w-48 rounded-full bg-cyan-500/25 blur-3xl" />
            </div>

            <div className="relative space-y-3 text-xs text-slate-100">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                  Unlock report
                </p>
                <h2 className="mt-1 text-sm font-semibold text-slate-50">
                  One-time payment for this evaluation
                </h2>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-slate-300/90">Amount</p>
                  <p className="text-sm font-semibold text-emerald-300">
                    Rs 99
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[11px] text-slate-300/90">Access</p>
                  <p className="text-[11px] font-medium text-slate-100">
                    Full report for this task
                  </p>
                </div>
              </div>

              {step === "success" && (
                <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                  Payment successful. Unlocking your report…
                </p>
              )}

              {step === "error" && error && (
                <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3 text-[11px] text-slate-200 hover:bg-slate-800/80"
                  onClick={handleClose}
                  disabled={isBusy}
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  className="h-8 min-w-[120px] rounded-full bg-emerald-500 px-4 text-[11px] font-semibold text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.5)] hover:bg-emerald-400 disabled:opacity-80"
                  onClick={handleConfirm}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    "Confirm & pay"
                  )}
                </Button>
              </div>

              <p className="pt-1 text-[10px] text-slate-400">
                This is a demo payment flow: no real money is charged, but your report will be marked as unlocked.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
