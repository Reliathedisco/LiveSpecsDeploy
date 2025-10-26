import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const webhooks = (await sql`
      SELECT * FROM webhooks
      WHERE spec_id = ${id}
      ORDER BY created_at DESC
    `) as Array<Record<string, unknown>>

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Failed to fetch webhooks:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { url, events } = await request.json()

    if (!url || !events || events.length === 0) {
      return NextResponse.json({ error: "URL and events are required" }, { status: 400 })
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString("hex")

    const webhookRows = (await sql`
      INSERT INTO webhooks (spec_id, url, events, secret)
      VALUES (${id}, ${url}, ${events}, ${secret})
      RETURNING *
    `) as Array<Record<string, unknown>>

    return NextResponse.json(webhookRows[0])
  } catch (error) {
    console.error("Failed to create webhook:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
