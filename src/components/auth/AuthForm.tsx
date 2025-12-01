"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/lib/auth-schema"
import { usePasswordVisibility } from "@/hooks/usePasswordVisibility"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "login" | "signup"

type AuthFormProps = {
  mode: Mode
}

export function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login"
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordVisibility = usePasswordVisibility(false)
  const confirmPasswordVisibility = usePasswordVisibility(false)

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const redirectTarget = searchParams?.get("redirectedFrom") ?? "/dashboard"

  const onSubmit = async (data: LoginFormValues | SignupFormValues) => {
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Login successful",
          description: `Welcome back, ${data.email}`,
        })
        router.replace(redirectTarget)
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Account created",
          description: `We've registered ${data.email}. Please verify your email if required.`,
        })
        router.push("/login")
      }
    } catch (error) {
      const description = error instanceof Error ? error.message : "Something went wrong"
      toast({
        title: "Authentication error",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      form.reset()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={passwordVisibility.visible ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={passwordVisibility.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {passwordVisibility.visible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLogin && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={confirmPasswordVisibility.visible ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={confirmPasswordVisibility.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {confirmPasswordVisibility.visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </Form>
  )
}


