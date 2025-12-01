"use client"

import { clsx } from "clsx"

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}
