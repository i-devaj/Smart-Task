import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as z from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const bodySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  code: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { title, description, code } = parsed.data

    const supabase = getSupabaseServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to read session", details: sessionError.message },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        description,
        code: code ?? null,
      })
      .select("id")
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Failed to create task",
          details: error?.message ?? "Unknown error",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { id: data.id },
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


