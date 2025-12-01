import { createServerClient } from "@supabase/auth-helpers-nextjs"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { supabaseEnv } from "./config"
import type { Database } from "./types"

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}


