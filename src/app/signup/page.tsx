"use client"

import { Suspense } from "react"
import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { AuthForm } from "@/components/auth/AuthForm"

const Signup = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCard
      title="Task Evaluator"
      description="Create a new account"
      footer={
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Already have an account?{" "}
          <span className="font-semibold text-primary">Sign in</span>
        </Link>
      }
    >
      <AuthForm mode="signup" />
    </AuthCard>
    </Suspense>
  )
}

export default Signup;
