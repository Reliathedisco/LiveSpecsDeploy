import { sql } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find or create user
    let userRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE clerk_id = ${clerkUser.id}
    `) as { id: string }[]

    if (userRows.length === 0) {
      userRows = (await sql<{ id: string }>`
        INSERT INTO users (clerk_id, email, name, image_url, plan)
        VALUES (
          ${clerkUser.id},
          ${clerkUser.emailAddresses[0]?.emailAddress || "no-email@example.com"},
          ${`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null},
          ${clerkUser.imageUrl || null},
          'FREE'
        )
        RETURNING id
      `) as { id: string }[]
    }

    const userId = userRows[0].id

    // Get spec with owner and collaborators
    const specRows = (await sql`
      SELECT s.*, 
        json_build_object(
          'id', owner.id,
          'name', owner.name,
          'email', owner.email,
          'imageUrl', owner.image_url
        ) as owner
      FROM specs s
      JOIN users owner ON s.owner_id = owner.id
      LEFT JOIN collaborators c ON s.id = c.spec_id
      WHERE s.id = ${id} 
        AND (s.owner_id = ${userId} OR c.user_id = ${userId})
      LIMIT 1
    `) as Array<Record<string, any>>

    if (specRows.length === 0) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 })
    }

    // Get collaborators separately
    const collaborators = (await sql`
      SELECT 
        c.id,
        c.role,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'imageUrl', u.image_url
        ) as user
      FROM collaborators c
      JOIN users u ON c.user_id = u.id
      WHERE c.spec_id = ${id}
    `) as Array<{ id: string; role: string; user: Record<string, any> }>

    const result = {
      ...specRows[0],
      collaborators: collaborators.map((c) => ({
        id: c.id,
        role: c.role,
        user: c.user,
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching spec:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let userRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE clerk_id = ${clerkUser.id}
    `) as { id: string }[]

    if (userRows.length === 0) {
      userRows = (await sql<{ id: string }>`
        INSERT INTO users (clerk_id, email, name, image_url, plan)
        VALUES (
          ${clerkUser.id},
          ${clerkUser.emailAddresses[0]?.emailAddress || "no-email@example.com"},
          ${`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null},
          ${clerkUser.imageUrl || null},
          'FREE'
        )
        RETURNING id
      `) as { id: string }[]
    }

    const userId = userRows[0].id

    // Check if user has permission to edit
    const specRows = (await sql`
      SELECT s.id, s.content
      FROM specs s
      LEFT JOIN collaborators c ON s.id = c.spec_id AND c.user_id = ${userId}
      WHERE s.id = ${id} 
        AND (s.owner_id = ${userId} OR c.role IN ('EDITOR', 'ADMIN'))
      LIMIT 1
    `) as Array<{ id: string; content: string }>

    const spec = specRows[0]
    if (!spec) {
      return NextResponse.json({ error: "Spec not found or insufficient permissions" }, { status: 404 })
    }

    const body = await request.json()
    const { name, content } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) {
      updates.push(`name = $${updates.length + 1}`)
      values.push(name)
    }
    if (content !== undefined) {
      updates.push(`content = $${updates.length + 1}`)
      values.push(content)
    }

    updates.push(`updated_at = NOW()`)

    if (updates.length > 0) {
      const updatedSpecRows = (await sql`
        UPDATE specs 
        SET name = COALESCE(${name}, name),
            content = COALESCE(${content}, content),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `) as Array<Record<string, any>>

      // Create version if content changed
      if (content && content !== spec.content) {
        await sql`
          INSERT INTO spec_versions (spec_id, content, message)
          VALUES (${id}, ${content}, 'Auto-saved')
        `
      }

      return NextResponse.json(updatedSpecRows[0])
    }

    return NextResponse.json(spec)
  } catch (error) {
    console.error("[v0] Error updating spec:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE clerk_id = ${clerkUser.id}
    `) as { id: string }[]

    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user.id

    // Check if user is owner
    const specRows = (await sql`
      SELECT id FROM specs WHERE id = ${id} AND owner_id = ${userId}
    `) as { id: string }[]

    if (specRows.length === 0) {
      return NextResponse.json({ error: "Spec not found or insufficient permissions" }, { status: 404 })
    }

    // Delete spec (cascades to versions and collaborators)
    await sql`
      DELETE FROM specs WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting spec:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
