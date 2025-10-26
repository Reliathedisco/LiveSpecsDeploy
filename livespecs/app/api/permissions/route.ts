import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { specId, targetUserId, teamId, permission } = await request.json()

    if (!specId || !permission) {
      return NextResponse.json({ error: "Spec ID and permission required" }, { status: 400 })
    }

    if (!targetUserId && !teamId) {
      return NextResponse.json({ error: "User ID or Team ID required" }, { status: 400 })
    }

    // Verify requester has admin permission
    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const spec = (await sql`
      SELECT * FROM specs
      WHERE id = ${specId} AND owner_id = ${user.id}
    `) as Array<Record<string, unknown>>

    if (spec.length === 0) {
      return NextResponse.json({ error: "Spec not found or unauthorized" }, { status: 404 })
    }

    // Create permission
    const perm = (await sql`
      INSERT INTO permissions (spec_id, user_id, team_id, permission)
      VALUES (${specId}, ${targetUserId || null}, ${teamId || null}, ${permission})
      RETURNING *
    `) as Array<Record<string, unknown>>

    return NextResponse.json(perm[0])
  } catch (error) {
    console.error("Failed to create permission:", error)
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const specId = searchParams.get("specId")

    if (!specId) {
      return NextResponse.json({ error: "Spec ID required" }, { status: 400 })
    }

    const permissions = await sql`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        t.name as team_name
      FROM permissions p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.spec_id = ${specId}
      ORDER BY p.created_at DESC
    `

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Failed to fetch permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
