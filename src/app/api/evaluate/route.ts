import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { GoogleGenerativeAI } from "@google/generative-ai"

const bodySchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
})

// Schema matches your DB columns
const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  full_reports: z.string(), 
})

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

function extractJson(text: string): string {
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1) return text
  return text.substring(firstBrace, lastBrace + 1)
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const json = await request.json()
    const parsedBody = bodySchema.safeParse(json)
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const { taskId } = parsedBody.data
    const supabase = await getSupabaseServerClient()

    const prompt = `
      You are an expert task evaluator.
      Analyze the following task and provide a structured evaluation.
      Respond ONLY with valid JSON in this exact structure:
      {
        "score": number, // 0-100 based on clarity and feasibility
        "strengths": ["string", "string", "string"], // 3 key strengths
        "improvements": ["string", "string", "string"], // 3 concrete improvements
        "full_reports": "string" // A 2-3 sentence summary of the evaluation
      }
    `

    // Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse Response
    let evaluationData
    try {
      const cleanText = extractJson(responseText)
      evaluationData = JSON.parse(cleanText)
    } catch (e) {
      console.error("JSON Parse Error:", responseText)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const validation = evaluationSchema.safeParse(evaluationData)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid AI format", details: validation.error }, { status: 500 })
    }

    // --- Insert into Database ---
    const { data: evaluationRow, error: insertError } = await supabase
      .from("evaluations")
      .insert({
        task_id: taskId,
        score: validation.data.score,
        strengths: validation.data.strengths,
        improvements: validation.data.improvements,
        full_reports: validation.data.full_reports,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("DB Insert Error:", insertError)
      return NextResponse.json({ error: "DB Insert Failed", details: insertError.message }, { status: 500 })
    }

    // --- NEW: Update Task Status to Completed ---
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: 'completed' }) // Mark as finished
      .eq("id", taskId)

    if (updateError) {
      console.error("Failed to update task status:", updateError)
      
    }

    return NextResponse.json({ id: evaluationRow.id }, { status: 201 })

  } catch (error) {
    console.error("Evaluation Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}