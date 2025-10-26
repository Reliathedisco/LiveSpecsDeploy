'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Auth0 login
    router.push('/api/auth/login')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold">Redirecting to login...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  )
}