"use client"

import * as React from "react"
import { clsx } from "clsx"

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
}

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={clsx("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={clsx("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={clsx("p-6 pt-0", className)} {...props} />
}
