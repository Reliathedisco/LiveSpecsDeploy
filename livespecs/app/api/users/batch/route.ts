import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid userIds" }, { status: 400 })
    }

    const users = (await sql`
      SELECT id, name, email, image_url
      FROM users
      WHERE id = ANY(${userIds})
    `) as Array<{ id: string; name: string | null; email: string | null; image_url: string | null }>

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        name: user.name || user.email,
        avatar: user.image_url,
      })),
    )
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
