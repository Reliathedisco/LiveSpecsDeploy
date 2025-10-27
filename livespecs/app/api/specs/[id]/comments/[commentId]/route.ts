import { sql } from "@/lib/db";
import { getSession } from "@auth0/nextjs-auth0";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const session = await getSession(); const userId = session?.user?.sub
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commentId } = await params
    const { resolved, content } = await request.json()

    const userRows = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let comment
    if (resolved !== undefined) {
      comment = (await sql`
        UPDATE comments
        SET resolved = ${resolved}, updated_at = NOW()
        WHERE id = ${commentId}
        RETURNING *
      `) as Array<Record<string, unknown>>
    } else if (content) {
      comment = (await sql`
        UPDATE comments
        SET content = ${content}, updated_at = NOW()
        WHERE id = ${commentId} AND user_id = ${user.id}
        RETURNING *
      `) as Array<Record<string, unknown>>
    }

    if (!comment || comment.length === 0) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json(comment[0])
  } catch (error) {
    console.error("Failed to update comment:", error)
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const session = await getSession(); const userId = session?.user?.sub
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commentId } = await params

    const userRows = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = (await sql`
      DELETE FROM comments
      WHERE id = ${commentId} AND user_id = ${user.id}
      RETURNING id
    `) as { id: string }[]

    if (result.length === 0) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
