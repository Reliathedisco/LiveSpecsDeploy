import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

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

    const notifications = (await sql`
      SELECT * FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `) as Array<Record<string, unknown>>

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds } = await request.json()

    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await sql`
      UPDATE notifications
      SET read = true
      WHERE user_id = ${user.id}
      AND id = ANY(${notificationIds})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
  }
}
