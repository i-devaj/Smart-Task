"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { CheckCircle2, AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EvaluationResult {
  id: string
  createdAt: string
  isPaid: boolean
  taskTitle: string
  score: number | null
  summary: string
  recommendations: string[]
}

type LoadState = "idle" | "loading" | "error"

function useEvaluationResult() {
  const params = useParams<{ id: string }>()
  const [state, setState] = useState<LoadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EvaluationResult | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setState("loading")
      setError(null)

      try {
        const response = await fetch(`/api/results/${params.id}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const json = await response.json().catch(() => null)
          throw new Error(json?.error ?? "Failed to load evaluation")
        }

        const json = (await response.json()) as EvaluationResult
        setData(json)
        setState("idle")
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : "Unexpected error"
        setError(message)
        setState("error")
      }
    }

    if (params?.id) {
      load()
    }

    return () => controller.abort()
  }, [params?.id])

  return { state, error, data, setData }
}

function ScoreGauge({ score }: { score: number | null }) {
  const safeScore = Math.max(0, Math.min(100, score ?? 0))
  const rotation = useMemo(() => (safeScore / 100) * 180, [safeScore])

  const color =
    safeScore >= 80 ? "stroke-emerald-400" : safeScore >= 50 ? "stroke-amber-400" : "stroke-rose-400"

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-purple-500/20 blur-xl" />

      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <svg viewBox="0 0 120 60" className="absolute -top-1 h-24 w-24">
          <defs>
            <linearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M10 50 A 50 50 0 0 1 110 50"
            fill="none"
            stroke="url(#gauge)"
            strokeWidth={10}
            className="opacity-40"
          />
          <path
            d="M10 50 A 50 50 0 0 1 110 50"
            fill="none"
            stroke="url(#gauge)"
            strokeWidth={10}
            strokeDasharray="157"
            strokeDashoffset={157 - (157 * safeScore) / 100}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div
          className={"absolute bottom-2 left-1/2 h-10 w-[2px] -translate-x-1/2 origin-bottom rounded-full bg-white "}
          style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)`, transition: "transform 700ms ease-out" }}
        />

        <div className="relative flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/80">
            Score
          </span>
          <span className="text-4xl font-semibold text-white">
            {score == null ? "–" : Math.round(score)}
          </span>
          <span className="text-[11px] font-medium text-emerald-100/80">
            / 100
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  const router = useRouter()
  const { state, error, data, setData } = useEvaluationResult()
  const [isUnlocking, setIsUnlocking] = useState(false)

  const isLoading = state === "loading"

  const strengths = useMemo(() => {
    if (!data) return []
    const score = data.score ?? 0

    if (score >= 80) {
      return [
        "Very clear and well-scoped task.",
        "Good coverage of constraints and success criteria.",
        "High likelihood of smooth implementation.",
      ]
    }

    if (score >= 50) {
      return [
        "Core objective is reasonably clear.",
        "Some useful implementation details are already provided.",
      ]
    }

    return [
      "You have a starting idea that can be refined into a stronger task.",
    ]
  }, [data])

  const improvements = useMemo(() => {
    if (!data) return []
    if (data.recommendations.length > 0) return data.recommendations

    return [
      "Add explicit success metrics so you know when the task is done.",
      "Clarify edge cases or constraints the implementer should keep in mind.",
    ]
  }, [data])

  async function handleUnlock() {
    if (!data || data.isPaid || isUnlocking) return

    setIsUnlocking(true)
    try {
      const response = await fetch(`/api/results/${data.id}/unlock`, {
        method: "POST",
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.error ?? "Failed to unlock report")
      }

      setData((prev) => (prev ? { ...prev, isPaid: true } : prev))
    } catch (error) {
      console.error(error)
      alert("Could not unlock the report. Please try again.")
    } finally {
      setIsUnlocking(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 px-6 py-8 shadow-[0_0_40px_rgba(15,23,42,0.7)] backdrop-blur-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-200">Loading evaluation result…</p>
        </div>
      </div>
    )
  }

  if (state === "error" || !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/70 via-slate-950/70 to-slate-950/60 px-6 py-6 text-center shadow-[0_0_50px_rgba(127,29,29,0.7)] backdrop-blur-2xl">
          <p className="text-sm font-medium text-rose-100">
            {error ?? "Could not load this evaluation."}
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/past-reports")}> 
            Back to past reports
          </Button>
        </div>
      </div>
    )
  }

  const createdAt = new Date(data.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-200/80">
            Evaluation result
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
            {data.taskTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-300/80">
            Generated on {createdAt.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,_2fr)_minmax(0,_3fr)]">
        <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-950/80 text-white shadow-[0_0_60px_rgba(15,23,42,0.8)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-16 top-[-120px] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -right-10 bottom-[-80px] h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          </div>

          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50/90">
              Overall score
            </CardTitle>
            <CardDescription className="text-xs text-slate-200/80">
              Higher scores mean clearer, more executable tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex items-center justify-between gap-4">
            <ScoreGauge score={data.score} />
            <div className="space-y-3 text-xs text-slate-200/90">
              <p className="text-sm font-medium text-emerald-100">
                {data.score == null ? "No score available" : data.score >= 80 ? "Excellent" : data.score >= 50 ? "Decent" : "Needs work"}
              </p>
              <p className="text-xs leading-relaxed text-slate-200/80 line-clamp-4">
                {data.summary}
              </p>
              <p className="text-[11px] text-slate-300/70">
                This is a quick preview. Unlock the full report for a detailed breakdown.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-500/20 bg-slate-950/70 backdrop-blur-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Strengths
              </CardTitle>
              <CardDescription className="text-xs text-emerald-100/80">
                What you already did well when defining this task.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-emerald-50/90">
              {strengths.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-500/25 bg-slate-950/70 backdrop-blur-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Improvements
              </CardTitle>
              <CardDescription className="text-xs text-amber-50/80">
                Top opportunities to tighten up this task.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-amber-50/90">
              {improvements.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] text-amber-200">
                    {index + 1}
                  </span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="relative overflow-hidden border-white/12 bg-slate-950/80 shadow-[0_0_60px_rgba(15,23,42,0.8)] backdrop-blur-3xl">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-[-60px] h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-40px] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <CardHeader className="relative z-10 pb-3">
          <CardTitle className="flex items-center justify-between text-sm text-slate-50">
            <span>Full expert report</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
              One-time unlock
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-200/80">
            Get a detailed, implementation-ready breakdown of this task.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2 text-xs text-slate-100/90">
            {data.isPaid ? (
              <p className="leading-relaxed">
                You have unlocked the full report. Use the detailed suggestions above to refine the task, share it with your team, or turn it into a repeatable playbook.
              </p>
            ) : (
              <>
                <p className="leading-relaxed">
                  Unlock a richer analysis including specific acceptance criteria, phased rollout suggestions, and risk checks tailored to your task.
                </p>
                <p className="text-[11px] text-slate-200/70">
                  Perfect when you want to hand this off to someone else or standardize a recurring workflow.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            {data.isPaid ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-100">
                <Unlock className="h-3 w-3" />
                Full report unlocked
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.45)] hover:from-emerald-400 hover:to-cyan-400"
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Unlock full report 
                      <span className="ml-1 text-[11px] font-semibold">Rs 99</span>
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-slate-300/80">
                  No subscription. Unlock this report only.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
