import { cookies } from "next/headers"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabaseEnv } from "./config"
import type { Database } from "./types"

export function getSupabaseServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies()

  return createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore
          return store.get(name)?.value
        },
        set() {
          // no-op; server components cannot set cookies
        },
        remove() {
          // no-op; server components cannot remove cookies
        },
      },
    }
  )
}


