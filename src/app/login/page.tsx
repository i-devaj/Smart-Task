"use client"

import { Suspense } from "react"
import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { AuthForm } from "@/components/auth/AuthForm"

const Login = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCard
      title="Task Evaluator"
      description="Sign in to your account"
      footer={
        <Link
          href="/signup"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Don&apos;t have an account? <span className="font-semibold text-primary">Sign up</span>
        </Link>
      }
    >
      <AuthForm mode="login" />
    </AuthCard>
    </Suspense>
  )
}

export default Login;
