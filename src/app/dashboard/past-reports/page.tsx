"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Lock, Unlock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

type Report = {
  id: string
  title: string
  createdAt: string
  summary: string
  score: number | null
  isPaid: boolean
}

type Filter = "all" | "paid" | "unpaid"

export default function PastReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/results")
        if (!response.ok) {
          const json = await response.json().catch(() => null)
          throw new Error(json?.error ?? "Failed to load reports")
        }

        const json = (await response.json()) as { items: any[] }
        if (!isMounted) return

        const mapped: Report[] = (json.items ?? []).map((item) => ({
          id: String(item.id),
          title: String(item.taskTitle ?? "Untitled task"),
          createdAt: String(item.createdAt),
          summary: String(item.summary ?? "No summary available."),
          score: typeof item.score === "number" ? item.score : null,
          isPaid: Boolean(item.isPaid),
        }))

        setReports(mapped)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error"
        setError(message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredReports = useMemo(() => {
    if (filter === "paid") return reports.filter((r) => r.isPaid)
    if (filter === "unpaid") return reports.filter((r) => !r.isPaid)
    return reports
  }, [filter, reports])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Past Reports</h1>
        <p className="text-muted-foreground">
          Browse insights generated for your previous tasks.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Paid</span>
          <span className="mx-1 h-px w-4 bg-border/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Unpaid</span>
        </div>
        <div className="inline-flex gap-1 rounded-full border border-border/70 bg-muted/40 p-1 text-xs">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "paid" ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setFilter("paid")}
          >
            Paid
          </Button>
          <Button
            size="sm"
            variant={filter === "unpaid" ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setFilter("unpaid")}
          >
            Unpaid
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p>{error}</p>
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => location.reload()}>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Retry
          </Button>
        </div>
      ) : filteredReports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reports yet. Create a new task to generate your first evaluation.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredReports.map((report) => (
            <Link key={report.id} href={`/dashboard/results/${report.id}`}>
              <article className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 p-4 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold group-hover:text-emerald-400">
                      {report.title}
                    </h2>
                    {report.isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                        <Unlock className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                        <Lock className="h-3 w-3" /> Unpaid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {report.summary}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {report.score == null ? "–" : `${Math.round(report.score)} / 100`}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


