import { sql } from "@/lib/db"
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextResponse } from "next/server"

const DEFAULT_OPENAPI_SPEC = `openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: A sample API specification
servers:
  - url: https://api.example.com
    description: Production server
paths:
  /hello:
    get:
      summary: Say hello
      description: Returns a hello message
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Hello, World!"
`

export const POST = withApiAuthRequired(async function handler(request: Request) {
  try {
    console.log("[v0] === CREATE SPEC REQUEST STARTED ===")
    console.log("[v0] Getting current user from Auth0")

    const res = new NextResponse()
    const session = await getSession(request, res)

    if (!session || !session.user) {
      console.log("[v0] ERROR: No Auth0 user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] SUCCESS: Auth0 user found:", {
      id: session.user.sub,
      email: session.user.email,
    })

    let userRows: Array<{
      id: string
      plan: string
      owned_specs_count: number
    }> = []
    try {
      console.log("[v0] Querying database for user with auth0_id:", session.user.sub)
      userRows = (await sql`
        SELECT id, plan, 
          (SELECT COUNT(*) FROM specs WHERE owner_id = users.id) as owned_specs_count
        FROM users 
        WHERE clerk_id = ${session.user.sub}
      `) as Array<{
        id: string
        plan: string
        owned_specs_count: number
      }>
      console.log("[v0] User query completed:", userRows.length > 0 ? "User found" : "User not found")
    } catch (dbError) {
      console.error("[v0] DATABASE ERROR during user lookup:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
          hint: "Please check that your database is properly configured and the tables exist.",
        },
        { status: 500 },
      )
    }

    if (userRows.length === 0) {
      // Create new user
      console.log("[v0] Creating new user in database")
      try {
        userRows = (await sql`
          INSERT INTO users (clerk_id, email, name, image_url, plan)
          VALUES (
            ${session.user.sub},
            ${session.user.email || "no-email@example.com"},
            ${session.user.name || null},
            ${session.user.picture || null},
            'FREE'
          )
          RETURNING id, plan, 0 as owned_specs_count
        `) as Array<{
          id: string
          plan: string
          owned_specs_count: number
        }>
        console.log("[v0] SUCCESS: New user created with id:", userRows[0].id)
      } catch (dbError) {
        console.error("[v0] DATABASE ERROR during user creation:", dbError)
        return NextResponse.json(
          {
            error: "Failed to create user",
            details: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 },
        )
      }
    }

    const userData = userRows[0]
    console.log("[v0] User data:", { id: userData.id, plan: userData.plan, specs: userData.owned_specs_count })

    // Check plan limits
    if (userData.plan === "FREE" && userData.owned_specs_count >= 3) {
      console.log("[v0] User hit free plan limit")
      return NextResponse.json(
        { error: "Free plan limited to 3 specs. Upgrade to Team plan for unlimited specs." },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { name } = body
    const specName = name || "Untitled Spec"

    console.log("[v0] Creating spec with name:", specName)

    // Create spec
    let specRows: Array<{
      id: string
      name: string
      content: string
      owner_id: string
      created_at: Date
      updated_at: Date
    }> = []
    try {
      specRows = (await sql`
        INSERT INTO specs (name, content, owner_id)
        VALUES (
          ${specName},
          ${DEFAULT_OPENAPI_SPEC},
          ${userData.id}
        )
        RETURNING id, name, content, owner_id, created_at, updated_at
      `) as Array<{
        id: string
        name: string
        content: string
        owner_id: string
        created_at: Date
        updated_at: Date
      }>
      console.log("[v0] SUCCESS: Spec created with id:", specRows[0].id)
    } catch (dbError) {
      console.error("[v0] DATABASE ERROR during spec creation:", dbError)
      return NextResponse.json(
        {
          error: "Failed to create spec",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    // Create initial version
    try {
      await sql`
        INSERT INTO spec_versions (spec_id, content, message)
        VALUES (
          ${specRows[0].id},
          ${DEFAULT_OPENAPI_SPEC},
          'Initial version'
        )
      `
      console.log("[v0] SUCCESS: Initial version created")
    } catch (dbError) {
      console.error("[v0] DATABASE ERROR during version creation:", dbError)
      // Don't fail the request if version creation fails
      console.log("[v0] WARNING: Continuing despite version creation failure")
    }

    console.log("[v0] === CREATE SPEC REQUEST COMPLETED SUCCESSFULLY ===")
    return NextResponse.json(specRows[0])
  } catch (error) {
    console.error("[v0] UNEXPECTED ERROR in create spec:", error)
    return NextResponse.json(
      {
        error: "Failed to create spec",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
})
