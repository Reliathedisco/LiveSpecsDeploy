'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Auth0 signup
    router.push('/api/auth/login?screen_hint=signup')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
        <p className="text-muted-foreground">Redirecting to sign up page...</p>
      </div>
    </div>
  )
}