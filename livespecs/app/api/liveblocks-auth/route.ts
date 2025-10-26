import { getAuth0User } from "@/lib/auth0"
import { withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from "next/server"

export const POST = withApiAuthRequired(async function handler(request: NextRequest) {
  try {
    const user = await getAuth0User(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { room } = await request.json()

    return NextResponse.json({
      token: "mock-token",
      user: {
        id: user.sub,
        info: {
          name: user.name || "Anonymous",
          email: user.email,
          avatar: user.picture,
        },
      },
    })
  } catch (error) {
    console.error("Error authenticating with Liveblocks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
