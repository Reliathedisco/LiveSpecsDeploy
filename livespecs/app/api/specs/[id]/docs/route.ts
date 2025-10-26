import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify user has access to this spec
    const specRows = (await sql`
      SELECT s.*, u.clerk_id as owner_clerk_id
      FROM specs s
      JOIN users u ON s.owner_id = u.id
      WHERE s.id = ${id}
      AND (
        u.clerk_id = ${userId}
        OR EXISTS (
          SELECT 1 FROM collaborators c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.spec_id = s.id AND cu.clerk_id = ${userId}
        )
      )
    `) as Array<Record<string, any>>

    const spec = specRows[0]
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 })
    }

    // Generate documentation URL (in production, this would generate actual docs)
    const docsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/docs/${id}`

    // Store documentation generation in database
    await sql`
      INSERT INTO spec_versions (spec_id, content, version_number, created_by)
      VALUES (
        ${id},
  ${spec.content},
        (SELECT COALESCE(MAX(version_number), 0) + 1 FROM spec_versions WHERE spec_id = ${id}),
        (SELECT id FROM users WHERE clerk_id = ${userId})
      )
    `

    return NextResponse.json({ url: docsUrl })
  } catch (error) {
    console.error("Failed to generate documentation:", error)
    return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 })
  }
}
