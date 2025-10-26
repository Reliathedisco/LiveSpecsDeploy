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
    const { repoOwner, repoName, filePath, branch, autoSync } = await request.json()

    if (!repoOwner || !repoName || !filePath) {
      return NextResponse.json({ error: "Repository details required" }, { status: 400 })
    }

    // Get user's GitHub connection
    const userRows = (await sql<{ id: string }>`SELECT id FROM users WHERE clerk_id = ${userId}`) as {
      id: string
    }[]
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const connectionRows = (await sql`
      SELECT * FROM github_connections WHERE user_id = ${user.id}
    `) as Array<{
      access_token: string
    }>

    const connection = connectionRows[0]
    if (!connection) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 })
    }

    // Get spec content
    const specRows = (await sql<{ content: string; name: string }>`SELECT content, name FROM specs WHERE id = ${id}`) as {
      content: string
      name: string
    }[]
    const spec = specRows[0]
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 })
    }

    // Push to GitHub
    const result = await pushToGitHub(
      connection.access_token,
      repoOwner,
      repoName,
      filePath,
      spec.content,
      branch || "main",
      `Update ${spec.name}`,
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Store sync configuration
    await sql`
      INSERT INTO github_syncs (spec_id, repo_owner, repo_name, file_path, branch, auto_sync, last_synced_at)
      VALUES (${id}, ${repoOwner}, ${repoName}, ${filePath}, ${branch || "main"}, ${autoSync || false}, NOW())
      ON CONFLICT (spec_id) DO UPDATE
      SET repo_owner = ${repoOwner},
          repo_name = ${repoName},
          file_path = ${filePath},
          branch = ${branch || "main"},
          auto_sync = ${autoSync || false},
          last_synced_at = NOW()
    `

    return NextResponse.json({ success: true, url: result.url })
  } catch (error) {
    console.error("GitHub sync error:", error)
    return NextResponse.json({ error: "Failed to sync with GitHub" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const syncRows = (await sql`
      SELECT * FROM github_syncs WHERE spec_id = ${id}
    `) as Array<Record<string, unknown>>

    if (syncRows.length === 0) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      ...syncRows[0],
    })
  } catch (error) {
    console.error("Failed to get GitHub sync:", error)
    return NextResponse.json({ error: "Failed to get GitHub sync" }, { status: 500 })
  }
}

async function pushToGitHub(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Get current file SHA if it exists
    let sha: string | undefined
    try {
      const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      })

      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        sha = fileData.sha
      }
    } catch {
      // File doesn't exist, that's okay
    }

    // Create or update file
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha && { sha }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || "Failed to push to GitHub" }
    }

    const data = await response.json()
    return { success: true, url: data.content.html_url }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
