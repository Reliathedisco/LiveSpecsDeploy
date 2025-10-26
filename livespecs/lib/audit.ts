import { sql } from "@/lib/db"

export async function logAudit(params: {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  specId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, spec_id, metadata, ip_address, user_agent
      )
      VALUES (
        ${params.userId},
        ${params.action},
        ${params.resourceType},
        ${params.resourceId || null},
        ${params.specId || null},
        ${params.metadata ? JSON.stringify(params.metadata) : null},
        ${params.ipAddress || null},
        ${params.userAgent || null}
      )
    `
  } catch (error) {
    console.error("Failed to log audit:", error)
  }
}

export async function getAuditLogs(filters: {
  userId?: string
  specId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const conditions: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`)
    values.push(filters.userId)
  }

  if (filters.specId) {
    conditions.push(`spec_id = $${paramIndex++}`)
    values.push(filters.specId)
  }

  if (filters.action) {
    conditions.push(`action = $${paramIndex++}`)
    values.push(filters.action)
  }

  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`)
    values.push(filters.startDate)
  }

  if (filters.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`)
    values.push(filters.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = filters.limit || 100
  const offset = filters.offset || 0

  const query = `
    SELECT 
      al.*,
      u.name as user_name,
      u.email as user_email,
      s.name as spec_name
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    LEFT JOIN specs s ON al.spec_id = s.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `

  values.push(limit, offset)

  const result = await (sql as any).unsafe(query, values)
  if (Array.isArray(result)) {
    return result
  }
  if (result && Array.isArray(result.rows)) {
    return result.rows
  }
  return []
}
