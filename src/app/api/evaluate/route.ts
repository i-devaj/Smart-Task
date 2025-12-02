import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { buildEvaluationPrompt } from "@/lib/prompts"

const bodySchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
})

const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  recommendations: z.array(z.string()).default([]),
})

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

function extractJsonFromText(text: string): string {
  const trimmed = text.trim()

  // Remove ```json fences if present
  const fencedMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  return trimmed
}

async function readGeminiStreamingResponse(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error("Gemini streaming response has no body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let fullText = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)

      if (!line) continue

      try {
        const json = JSON.parse(line) as any
        const parts =
          json?.candidates?.[0]?.content?.parts ?? json?.candidates?.[0]?.content

        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (typeof part?.text === "string") {
              fullText += part.text
            }
          }
        } else if (typeof json?.candidates?.[0]?.output_text === "string") {
          fullText += json.candidates[0].output_text
        }
      } catch {
        // If a partial JSON line is received, keep it in the buffer for the next loop
        buffer = line + "\n" + buffer
        break
      }
    }
  }

  const remaining = buffer.trim()
  if (remaining) {
    try {
      const json = JSON.parse(remaining) as any
      const parts =
        json?.candidates?.[0]?.content?.parts ?? json?.candidates?.[0]?.content

      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (typeof part?.text === "string") {
            fullText += part.text
          }
        }
      } else if (typeof json?.candidates?.[0]?.output_text === "string") {
        fullText += json.candidates[0].output_text
      }
    } catch {
      // Swallow final parse errors and rely on whatever text we aggregated
    }
  }

  return fullText
}

async function callGeminiOnce(prompt: string): Promise<z.infer<typeof evaluationSchema>> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash"

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`
    )
  }

  const text = await readGeminiStreamingResponse(response)

  if (!text || typeof text !== "string") {
    throw new Error("Gemini API returned an unexpected response shape")
  }

  const jsonText = extractJsonFromText(text)
  const parsed = JSON.parse(jsonText)

  const evaluation = evaluationSchema.safeParse(parsed)
  if (!evaluation.success) {
    throw new Error(`Invalid evaluation JSON from model: ${evaluation.error.message}`)
  }

  return evaluation.data
}

async function callGeminiWithRetries(prompt: string, maxRetries = 2): Promise<z.infer<typeof evaluationSchema>> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGeminiOnce(prompt)
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      const delayMs = 500 * 2 ** attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error("Failed to call Gemini after retries")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedBody = bodySchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { taskId } = parsedBody.data

    const supabase = getSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        { error: "Failed to read user", details: userError.message },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Fetch task and ensure it belongs to the current user
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single<TaskRow>()

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found", details: taskError?.message },
        { status: 404 }
      )
    }

    const prompt = buildEvaluationPrompt(task)
    const evaluation = await callGeminiWithRetries(prompt)

    const { data: evaluationRow, error: evaluationError } = await supabase
      .from("evaluations")
      .insert({
        task_id: task.id,
        user_id: userId,
        result: evaluation,
      })
      .select("id")
      .single()

    if (evaluationError || !evaluationRow) {
      return NextResponse.json(
        {
          error: "Failed to store evaluation",
          details: evaluationError?.message ?? "Unknown error",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { id: evaluationRow.id },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}


