import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  console.log("--- Starting GET /api/results ---")

  try {
    // 1. Initialize Client
    const supabase = await getSupabaseServerClient()
    
    // 2. Auth Check
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth Error:", userError.message)
      return NextResponse.json({ error: "Failed to authenticate", details: userError.message }, { status: 500 })
    }

    if (!user) {
      console.error("No user session found.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log(`User authenticated: ${user.id}`)

    // 3. Database Query
    // We select specific columns. Note: 'tasks!inner' enforces an inner join to filter by user_id
    console.log("Querying Supabase...")
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        created_at,
        is_paid,
        score,
        full_reports,
        tasks!inner ( title, user_id )
      `)
      .eq("tasks.user_id", user.id) // Filter via the joined task because evaluations has no user_id
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase Query Error:", error)
      return NextResponse.json({ error: "Database query failed", details: error.message }, { status: 500 })
    }

    console.log(`Retrieved ${data?.length ?? 0} rows from database.`)

    // 4. Data Mapping
    // We map the database columns to the shape your frontend expects
    const items = (data ?? []).map((row: any) => {
      try {
        const taskTitle = row.tasks?.title ?? "Untitled task"
        // Use 'full_reports' as the summary if available
        const summary = row.full_reports 
          ? (row.full_reports.length > 100 ? row.full_reports.substring(0, 100) + "..." : row.full_reports)
          : "No summary available."

        return {
          id: row.id,
          createdAt: row.created_at,
          isPaid: row.is_paid ?? false,
          taskTitle: taskTitle,
          score: row.score,
          summary: summary,
        }
      } catch (mapError) {
        console.error("Error mapping row:", row, mapError)
        return null
      }
    }).filter(Boolean) // Remove any rows that failed mapping

    console.log("Data mapping complete. Returning JSON.")
    
    return NextResponse.json({ items })

  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    )
  }
}