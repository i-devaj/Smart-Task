"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/LogoutButton"

type DashboardShellProps = {
  userEmail: string | null
  children: ReactNode
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/new-task", label: "New Task" },
  { href: "/dashboard/past-reports", label: "Past Reports" },
]

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mr-1 h-9 w-9 md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Signed in as
              </span>
              <span className="text-sm font-semibold">
                {userEmail ?? "Anonymous"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        <aside className="md:w-56">
          <nav className="flex flex-row gap-2 overflow-x-auto rounded-lg border border-border/60 bg-card p-2 md:flex-col">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start text-sm"
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-lg border border-border/60 bg-card/60 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}


