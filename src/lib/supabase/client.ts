"use client"

import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabaseEnv } from "./config"
import type { Database } from "./types"

let client: SupabaseClient<Database> | undefined

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!client) {
    client = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey)
  }

  return client
}


