import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`)
    }

    const { userId } = JSON.parse(Buffer.from(state, "base64").toString())

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_token_failed`)
    }

    // Get GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const githubUser = await userResponse.json()

    // Store connection
    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_not_found`)
    }

    await sql`
      INSERT INTO github_connections (user_id, github_user_id, github_username, access_token, refresh_token)
      VALUES (${user.id}, ${githubUser.id.toString()}, ${githubUser.login}, ${tokenData.access_token}, ${tokenData.refresh_token || null})
      ON CONFLICT (user_id) DO UPDATE
      SET github_user_id = ${githubUser.id.toString()},
          github_username = ${githubUser.login},
          access_token = ${tokenData.access_token},
          refresh_token = ${tokenData.refresh_token || null},
          updated_at = NOW()
    `

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_connected=true`)
  } catch (error) {
    console.error("GitHub callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_callback_failed`)
  }
}
