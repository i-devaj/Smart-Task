const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// WARN instead of throwing error during module load. 
// This prevents build crashes when env vars are temporarily missing.
if (!url || !anonKey) {
  console.warn("Warning: Supabase environment variables are missing. This may cause runtime errors.")
}

export const supabaseEnv = {
  url: url ?? "",
  anonKey: anonKey ?? "",
} as const