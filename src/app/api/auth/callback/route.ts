import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/types"
import { supabaseEnv } from "@/lib/supabase/config"

async function exchangeCode(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirect_to") ?? "/dashboard"

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  if (!code) {
    return response
  }

  const supabase = createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        get(name) {
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

  await supabase.auth.exchangeCodeForSession(code)

  return response
}

export async function GET(request: NextRequest) {
  return exchangeCode(request)
}

export async function POST(request: NextRequest) {
  return exchangeCode(request)
}


