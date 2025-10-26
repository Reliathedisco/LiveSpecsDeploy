import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { promises as dns } from "dns"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const domainRows = (await sql`
      SELECT cd.*, t.owner_id
      FROM custom_domains cd
      JOIN teams t ON cd.team_id = t.id
      WHERE cd.id = ${id}
    `) as Array<Record<string, any>>

    const domain = domainRows[0]
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user || user.id !== domain.owner_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify DNS record
    try {
      const txtRecords = await dns.resolveTxt(`_livespecs-verification.${domain.domain}`)
      const verified = txtRecords.some((record) => record.join("") === domain.verification_token)

      if (verified) {
        await sql`
          UPDATE custom_domains
          SET verified = true, verified_at = NOW(), updated_at = NOW()
          WHERE id = ${id}
        `

        return NextResponse.json({ verified: true })
      } else {
        return NextResponse.json({ verified: false, error: "Verification token not found in DNS" })
      }
    } catch (error) {
      return NextResponse.json({ verified: false, error: "DNS lookup failed" })
    }
  } catch (error) {
    console.error("Domain verification failed:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
