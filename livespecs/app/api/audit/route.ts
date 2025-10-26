import { getAuditLogs } from "@/lib/audit"
import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const specId = searchParams.get("specId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Check if user has admin access
    const users = (await sql<{ id: string; plan: string }>`SELECT id, plan FROM users WHERE clerk_id = ${userId}`) as Array<{
      id: string
      plan: string
    }>
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only ENTERPRISE users can access audit logs
    if (user.plan !== "ENTERPRISE") {
      return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 })
    }

    const logs = await getAuditLogs({
      userId: user.id,
      specId: specId || undefined,
      action: action || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
