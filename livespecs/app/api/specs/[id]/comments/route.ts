import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const comments = (await sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        u.image_url as user_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.spec_id = ${id}
      ORDER BY c.line_number, c.created_at ASC
    `) as Array<Record<string, unknown>>

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content, lineNumber, parentId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const userRows = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const commentRows = (await sql`
      INSERT INTO comments (spec_id, user_id, content, line_number, parent_id)
      VALUES (${id}, ${user.id}, ${content}, ${lineNumber || null}, ${parentId || null})
      RETURNING *
    `) as Array<Record<string, unknown>>

    // Create notification for spec owner and collaborators
    const specRows = (await sql<{ owner_id: string }>`SELECT owner_id FROM specs WHERE id = ${id}`) as {
      owner_id: string
    }[]
    const spec = specRows[0]
    if (spec) {
      await sql`
        INSERT INTO notifications (user_id, spec_id, type, title, message)
        SELECT 
          u.id,
          ${id},
          'comment',
          'New comment on your spec',
          ${`${content.substring(0, 100)}...`}
        FROM users u
        WHERE u.id = ${spec.owner_id} AND u.id != ${user.id}
      `
    }

    return NextResponse.json(commentRows[0])
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
