import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import yaml from "js-yaml"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, name } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Parse the content (could be YAML or JSON)
    let parsedSpec
    try {
      // Try parsing as JSON first
      parsedSpec = JSON.parse(content)
    } catch {
      // If JSON fails, try YAML
      try {
        parsedSpec = yaml.load(content)
      } catch (yamlError) {
        return NextResponse.json({ error: "Invalid spec format. Must be valid JSON or YAML" }, { status: 400 })
      }
    }

    // Validate it's an OpenAPI spec
    if (!parsedSpec.openapi && !parsedSpec.swagger) {
      return NextResponse.json(
        { error: "Invalid OpenAPI specification. Missing 'openapi' or 'swagger' field" },
        { status: 400 },
      )
    }

    // Get or create user in database
    const users = (await sql`
      INSERT INTO users (clerk_id, email, name)
      VALUES (${userId}, ${userId}@clerk.user, 'User')
      ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = ${userId}
      RETURNING id
    `) as { id: string }[]
    const dbUser = users[0]
    const dbUserId = dbUser?.id

    if (!dbUserId) {
      return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 })
    }

    // Convert back to YAML for storage
    const yamlContent = yaml.dump(parsedSpec)
    const specName = name || parsedSpec.info?.title || "Imported Spec"

    // Create the spec
    const result = (await sql`
      INSERT INTO specs (name, content, owner_id, created_at, updated_at)
      VALUES (${specName}, ${yamlContent}, ${dbUserId}, NOW(), NOW())
      RETURNING id, name, content, created_at, updated_at
    `) as Array<Record<string, unknown>>

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Import spec error:", error)
    return NextResponse.json(
      { error: "Failed to import spec", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
