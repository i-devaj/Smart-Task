export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Quick overview of your tasks and recent evaluation reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Active tasks</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Reports this week</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-sm font-medium text-muted-foreground">Average score</p>
          <p className="mt-2 text-3xl font-semibold">–</p>
        </div>
      </div>
    </div>
  )
}

