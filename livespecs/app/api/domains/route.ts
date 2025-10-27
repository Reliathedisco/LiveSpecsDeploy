import { sql } from "@/lib/db"
import { getSession } from "@auth0/nextjs-auth0"
import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(); if (!session || !session.user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }; const userId = session.user.sub
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, domain } = await request.json()

    if (!teamId || !domain) {
      return NextResponse.json({ error: "Team ID and domain required" }, { status: 400 })
    }

    // Verify user is team owner
    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const teamRows = (await sql`
      SELECT * FROM teams
      WHERE id = ${teamId} AND owner_id = ${user.id}
    `) as Array<Record<string, unknown>>

    const team = teamRows[0]
    if (!team) {
      return NextResponse.json({ error: "Team not found or unauthorized" }, { status: 404 })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    const customDomainRows = (await sql`
      INSERT INTO custom_domains (team_id, domain, verification_token)
      VALUES (${teamId}, ${domain}, ${verificationToken})
      RETURNING *
    `) as Array<Record<string, unknown>>

    return NextResponse.json({
      ...customDomainRows[0],
      verificationInstructions: {
        type: "TXT",
        name: `_livespecs-verification.${domain}`,
        value: verificationToken,
      },
    })
  } catch (error: any) {
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 409 })
    }
    console.error("Failed to add domain:", error)
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(); if (!session || !session.user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }; const userId = session.user.sub
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 })
    }

    const domains = await sql`
      SELECT * FROM custom_domains
      WHERE team_id = ${teamId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(domains)
  } catch (error) {
    console.error("Failed to fetch domains:", error)
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
  }
}
