import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      teamId,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      customCss,
      companyName,
      supportEmail,
      hideLivespecsBranding,
    } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 })
    }

    // Verify user is team owner
    const users = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const teamRows = (await sql`
      SELECT * FROM teams
      WHERE id = ${teamId} AND owner_id = ${user.id}
    `) as Array<Record<string, unknown>>

    const team = teamRows[0]
    if (!team) {
      return NextResponse.json({ error: "Team not found or unauthorized" }, { status: 404 })
    }

    const brandingRows = (await sql`
      INSERT INTO branding_settings (
        team_id, logo_url, favicon_url, primary_color, secondary_color,
        custom_css, company_name, support_email, hide_livespecs_branding
      )
      VALUES (
        ${teamId}, ${logoUrl || null}, ${faviconUrl || null}, ${primaryColor || "#000000"},
        ${secondaryColor || "#ffffff"}, ${customCss || null}, ${companyName || null},
        ${supportEmail || null}, ${hideLivespecsBranding || false}
      )
      ON CONFLICT (team_id) DO UPDATE
      SET logo_url = ${logoUrl || null},
          favicon_url = ${faviconUrl || null},
          primary_color = ${primaryColor || "#000000"},
          secondary_color = ${secondaryColor || "#ffffff"},
          custom_css = ${customCss || null},
          company_name = ${companyName || null},
          support_email = ${supportEmail || null},
          hide_livespecs_branding = ${hideLivespecsBranding || false},
          updated_at = NOW()
      RETURNING *
    `) as Array<Record<string, unknown>>

    return NextResponse.json(brandingRows[0])
  } catch (error) {
    console.error("Failed to update branding:", error)
    return NextResponse.json({ error: "Failed to update branding" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get("teamId")
    const domain = searchParams.get("domain")

    let brandingRows: Array<Record<string, unknown>>

    if (domain) {
      // Get branding by custom domain
      brandingRows = (await sql`
        SELECT bs.* FROM branding_settings bs
        JOIN custom_domains cd ON bs.team_id = cd.team_id
        WHERE cd.domain = ${domain} AND cd.verified = true
      `) as Array<Record<string, unknown>>
    } else if (teamId) {
      // Get branding by team ID
      brandingRows = (await sql`
        SELECT * FROM branding_settings WHERE team_id = ${teamId}
      `) as Array<Record<string, unknown>>
    } else {
      return NextResponse.json({ error: "Team ID or domain required" }, { status: 400 })
    }

    if (brandingRows.length === 0) {
      return NextResponse.json({ branding: null })
    }

    return NextResponse.json(brandingRows[0])
  } catch (error) {
    console.error("Failed to fetch branding:", error)
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 })
  }
}
