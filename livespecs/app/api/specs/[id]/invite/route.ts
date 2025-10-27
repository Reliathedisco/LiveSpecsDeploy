import { sql } from "@/lib/db"
import { getSession } from "@auth0/nextjs-auth0"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(); const clerkUser = session?.user

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE clerk_id = ${clerkUser.sub}
    `) as { id: string }[]

    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user.id

    const specRows = (await sql<{ id: string }>`
      SELECT id FROM specs WHERE id = ${id} AND owner_id = ${userId}
    `) as { id: string }[]

    if (specRows.length === 0) {
      return NextResponse.json({ error: "Spec not found or insufficient permissions" }, { status: 404 })
    }

    const body = await request.json()
    const { email } = body

    const invitedUserRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE email = ${email}
    `) as { id: string }[]

    const invitedUser = invitedUserRows[0]
    if (!invitedUser) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 })
    }

    const invitedUserId = invitedUser.id

    const existingCollaborator = (await sql`
      SELECT id FROM collaborators 
      WHERE spec_id = ${id} AND user_id = ${invitedUserId}
    `) as { id: string }[]

    if (existingCollaborator.length > 0) {
      return NextResponse.json({ error: "User is already a collaborator" }, { status: 400 })
    }

    await sql`
      INSERT INTO collaborators (spec_id, user_id, role)
      VALUES (${id}, ${invitedUserId}, 'EDITOR')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error inviting collaborator:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
