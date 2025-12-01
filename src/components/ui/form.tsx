"use client"

import * as React from "react"
import { FormProvider, useFormContext } from "react-hook-form"
import { clsx } from "clsx"

export const Form = FormProvider

export type FormFieldProps = {
  name: string
  children: (field: ReturnType<typeof useFormContext>["register"] extends (...args: any) => any
    ? { field: ReturnType<ReturnType<typeof useFormContext>["register"]> }
    : never) => React.ReactNode
}

// NOTE: To keep things simple and type-safe enough, we won't fully model generics here.
// For typical usage with react-hook-form, this works fine.
export function FormField(props: any) {
  const { name, render, ...rest } = props
  const { register, formState } = useFormContext()
  const error = (formState.errors as any)?.[name]

  if (typeof render === "function") {
    return render({
      field: {
        ...register(name),
        ...rest,
      } as any,
      error,
    } as any)
  }

  return null
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("space-y-1.5", className)} {...props} />
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
}

export function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("space-y-1", className)} {...props} />
}

export function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null

  return (
    <p className={clsx("text-xs text-destructive", className)} {...props}>
      {children}
    </p>
  )
}
