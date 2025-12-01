"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
      setIsSigningOut(false)
      return
    }

    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    })

    router.replace("/login")
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  )
}


