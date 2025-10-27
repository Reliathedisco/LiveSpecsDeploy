"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-lg font-bold text-white">L</span>
              </div>
              <span className="text-xl font-bold">LiveSpecs</span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link
                href="#demo"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Demo
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-32 pb-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge with pulse */}
          <div className="mb-8 flex justify-center">
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Now in Public Beta
            </Badge>
          </div>

          {/* Headline with gradient */}
          <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            <span className="block">Design APIs</span>
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              together, in real-time
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            The collaborative API design platform that brings your team together. Design, document, and deploy APIs
            faster than ever before.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Designing Free
                </span>
              </Button>
            </Link>

            <Link href="#demo">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Try Live Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <p className="mt-12 text-sm text-muted-foreground">
            • <span className="font-medium text-foreground">Trusted by teams at top companies</span>
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 009.288 0M15 7a3 3 0 10-6 0 3 3 0 006 0zm6 3a2 2 0 10-4 0 2 2 0 004 0zM7 10a2 2 0 10-4 0 2 2 0 004 0z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold">Real-time Collaboration</h3>
            <p className="text-muted-foreground">
              Work together with your team in real-time. See changes instantly as they happen, with live cursors and
              presence indicators.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold">Mock Servers</h3>
            <p className="text-muted-foreground">
              Generate mock servers instantly from your API specs. Test and iterate without waiting for backend
              implementation.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold">Version Control</h3>
            <p className="text-muted-foreground">
              Built-in version control for your API specs. Track changes, review history, and roll back when needed with
              Git-like workflows.
            </p>
          </Card>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-12 text-center backdrop-blur-sm">
          <h2 className="mb-4 text-balance text-3xl font-bold sm:text-4xl">Ready to transform your API workflow?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground">
            Join thousands of developers building better APIs together.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
            >
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Get Started for Free
              </span>
            </Button>
          </Link>
        </Card>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2025 LiveSpecs. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
