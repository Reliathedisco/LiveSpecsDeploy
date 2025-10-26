import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, expiresIn } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }

    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate API key
    const apiKey = `ls_${crypto.randomBytes(32).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")
    const keyPrefix = apiKey.substring(0, 10)

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null

    const keyRows = (await sql`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
      VALUES (${user.id}, ${name}, ${keyHash}, ${keyPrefix}, ${expiresAt})
      RETURNING id, name, key_prefix, expires_at, created_at
    `) as {
      id: string
      name: string
      key_prefix: string
      expires_at: Date | null
      created_at: Date
    }[]

    return NextResponse.json({
      ...keyRows[0],
      key: apiKey, // Only returned once
    })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const keys = (await sql`
      SELECT id, name, key_prefix, last_used_at, expires_at, created_at, revoked_at
      FROM api_keys
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `) as Array<{
      id: string
      name: string
      key_prefix: string
      last_used_at: Date | null
      expires_at: Date | null
      created_at: Date
      revoked_at: Date | null
    }>

    return NextResponse.json(keys)
  } catch (error) {
    console.error("Failed to fetch API keys:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { keyId } = await request.json()

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 })
    }

    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await sql`
      UPDATE api_keys
      SET revoked_at = NOW()
      WHERE id = ${keyId} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to revoke API key:", error)
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 })
  }
}
