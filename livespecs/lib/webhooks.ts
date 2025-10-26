import crypto from "crypto";

export async function triggerWebhook(
  webhookUrl: string,
  secret: string,
  eventType: string,
  payload: any,
): Promise<{ status: number; body: string }> {
  try {
    const timestamp = Date.now()
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${JSON.stringify(payload)}`)
      .digest("hex")

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LiveSpecs-Event": eventType,
        "X-LiveSpecs-Signature": signature,
        "X-LiveSpecs-Timestamp": timestamp.toString(),
      },
      body: JSON.stringify(payload),
    })

    return {
      status: response.status,
      body: await response.text(),
    }
  } catch (error) {
    console.error("Webhook delivery failed:", error)
    return {
      status: 0,
      body: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function notifyWebhooks(specId: string, eventType: string, payload: any) {
  const { sql } = await import("@/lib/db")

  const webhooks = (await sql`
    SELECT * FROM webhooks
    WHERE spec_id = ${specId}
    AND active = true
    AND ${eventType} = ANY(events)
  `) as Array<Record<string, any>>

  for (const webhook of webhooks) {
    const result = await triggerWebhook(webhook.url, webhook.secret, eventType, payload)

    await sql`
      INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_status, response_body)
      VALUES (${webhook.id}, ${eventType}, ${JSON.stringify(payload)}, ${result.status}, ${result.body})
    `
  }
}
