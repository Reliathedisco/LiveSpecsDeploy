import { sql } from "@/lib/db"
import { withPerf } from "@/lib/utils"
import { getSession } from "@auth0/nextjs-auth0"
import { NextResponse } from "next/server"

export async function GET() {
  return withPerf("api:specs:list", async () => {
    const session = await getSession(); const clerkUser = session?.user

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find or create user
    let userRows = (await sql<{ id: string }>`
      SELECT id FROM users WHERE clerk_id = ${clerkUser.sub}
    `) as { id: string }[]

    if (userRows.length === 0) {
      userRows = (await sql<{ id: string }>`
        INSERT INTO users (clerk_id, email, name, image_url, plan)
        VALUES (
          ${clerkUser.id},
          ${clerkUser.email || "no-email@example.com"},
          ${clerkUser.name || null},
          ${clerkUser.picture || null},
          'FREE'
        )
        RETURNING id
      `) as { id: string }[]
    }

    const userId = userRows[0].id

    // Get specs owned by user or where user is a collaborator
    const specs = (await sql`
      SELECT DISTINCT 
        s.id, 
        s.name, 
        s.content,
        s.owner_id,
        s.created_at, 
        s.updated_at,
        (SELECT COUNT(*) FROM collaborators WHERE spec_id = s.id) as collaborator_count
      FROM specs s
      LEFT JOIN collaborators c ON s.id = c.spec_id
      WHERE s.owner_id = ${userId} OR c.user_id = ${userId}
      ORDER BY s.updated_at DESC
    `) as Array<{
      id: string
      name: string
      content: string
      owner_id: string
      created_at: Date
      updated_at: Date
      collaborator_count: string | number
    }>

    // Format response to match expected structure
    const formattedSpecs = specs.map((spec) => ({
      id: spec.id,
      name: spec.name,
      content: spec.content,
      ownerId: spec.owner_id,
      createdAt: spec.created_at,
      updatedAt: spec.updated_at,
      _count: {
        collaborators: Number(spec.collaborator_count),
      },
    }))

    return new NextResponse(JSON.stringify(formattedSpecs), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30, stale-while-revalidate=300",
      },
    })
  })
}
