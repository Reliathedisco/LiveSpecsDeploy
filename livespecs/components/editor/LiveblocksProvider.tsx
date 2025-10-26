"use client"

import type { ReactNode } from "react"
import { LiveblocksProvider as LiveblocksProviderBase } from "@liveblocks/react/suspense"
import { useUser } from "@auth0/nextjs-auth0/client"

export function LiveblocksProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()

  return (
    <LiveblocksProviderBase
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room }),
        })

        if (!response.ok) {
          throw new Error("Failed to authenticate with Liveblocks")
        }

        return await response.json()
      }}
      resolveUsers={async ({ userIds }) => {
        const response = await fetch("/api/users/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        })

        if (!response.ok) {
          return []
        }

        return await response.json()
      }}
    >
      {children}
    </LiveblocksProviderBase>
  )
}
