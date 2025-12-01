import type { Database } from "@/lib/supabase/types"

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

export function buildEvaluationPrompt(task: TaskRow) {
  const codeSection = task.code
    ? `\n\nRelevant code or pseudocode:\n\`\`\`\n${task.code}\n\`\`\``
    : ""

  return [
    "You are an expert task evaluator.",
    "Given the following task, provide a structured JSON evaluation.",
    "",
    `Title: ${task.title}`,
    "",
    `Description:\n${task.description}`,
    codeSection,
    "",
    "Respond ONLY with JSON in the following shape:",
    `{
  "score": number,        // 0-100 score for task clarity and feasibility
  "summary": string,      // short natural language summary
  "recommendations": [    // 3-7 concrete suggestions
    "string"
  ]
}`,
  ].join("\n")
}


