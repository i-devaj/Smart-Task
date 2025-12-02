"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { CodeEditor } from "@/components/dashboard/CodeEditor"

const newTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  code: z
    .string()
    .min(10, "Please include at least a few lines of code or pseudocode")
    .optional()
    .or(z.literal("").transform(() => undefined)),
})

type NewTaskValues = z.infer<typeof newTaskSchema>

export default function NewTaskPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const form = useForm<NewTaskValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
    },
  })

  const onSubmit = async (values: NewTaskValues) => {
    setIsSubmitting(true)
    setIsEvaluating(false)

    try {
      // 1) Create the task via API
      const createResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const createJson = await createResponse.json()

      if (!createResponse.ok || !createJson?.id) {
        const message = createJson?.details?.message ?? createJson?.error ?? "Failed to create task"
        throw new Error(message)
      }

      const taskId: string = createJson.id

      toast({
        title: "Task created",
        description: "Running evaluation...",
      })

      // 2) Run evaluation for the created task
      setIsEvaluating(true)

      const evaluateResponse = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      })

      const evaluateJson = await evaluateResponse.json()

      if (!evaluateResponse.ok || !evaluateJson?.id) {
        const message = evaluateJson?.details?.message ?? evaluateJson?.error ?? "Failed to evaluate task"
        throw new Error(message)
      }

      const evaluationId: string = evaluateJson.id

      // Reset the form and navigate to the result page
      form.reset()
      router.push(`/dashboard/results/${evaluationId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast({
        title: "Could not run evaluation",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsEvaluating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Task</h1>
        <p className="text-muted-foreground">
          Describe the task you want the Smart Task Evaluator to analyze.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* @ts-ignore - our lightweight FormField typing uses any for field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Summarize the task in a sentence" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @ts-ignore - our lightweight FormField typing uses any for field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Task details</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="Provide full context and constraints so the evaluator can give precise feedback."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @ts-ignore - our lightweight FormField typing uses any for field */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Code (optional)</FormLabel>
                <FormControl>
                  <div className="rounded-md border border-border/60 bg-muted/40">
                    <CodeEditor
                      value={field.value ?? ""}
                      onChange={(val: string) =>
                        field.onChange({ target: { name: field.name, value: val } })
                      }
                      language="typescript"
                      height="260px"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (isEvaluating ? "Evaluating..." : "Creating task...") : "Run evaluation"}
          </Button>
        </form>
      </Form>
    </div>
  )
}


