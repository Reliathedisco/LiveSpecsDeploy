import { getSession } from "@auth0/nextjs-auth0"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { room } = await request.json()

    return NextResponse.json({
      token: "mock-token",
      user: {
        id: session.user.sub,
        info: {
          name: session.user.name || "Anonymous",
          email: session.user.email,
          avatar: session.user.picture,
        },
      },
    })
  } catch (error) {
    console.error("Error authenticating with Liveblocks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
