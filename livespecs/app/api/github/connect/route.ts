import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: "GitHub integration not configured" }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/github/callback`
    const state = Buffer.from(JSON.stringify({ userId })).toString("base64")

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo&state=${state}`

    return NextResponse.redirect(githubAuthUrl)
  } catch (error) {
    console.error("GitHub connect error:", error)
    return NextResponse.json({ error: "Failed to connect to GitHub" }, { status: 500 })
  }
}
