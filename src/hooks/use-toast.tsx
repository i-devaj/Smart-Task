"use client"

import * as React from "react"

export type ToastVariant = "default" | "destructive"

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
}

export type Toast = ToastOptions & { id: number }

const ToastContext = React.createContext<{
  toasts: Toast[]
  toast: (options: ToastOptions) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((options: ToastOptions) => {
    setToasts((current) => [
      ...current,
      {
        id: Date.now(),
        variant: "default",
        ...options,
      },
    ])

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      {/* Simple inline toast list; you can replace with a fancier UI later */}
      <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-full max-w-md rounded-md border px-3 py-2 text-sm shadow-md ${
              t.variant === "destructive"
                ? "border-destructive/70 bg-destructive text-destructive-foreground"
                : "border-border/70 bg-background text-foreground"
            }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs opacity-90">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    return {
      toasts: [] as Toast[],
      toast: (_options: ToastOptions) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("useToast called outside of ToastProvider")
        }
      },
    }
  }

  return ctx
}
