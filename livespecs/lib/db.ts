import { neon } from "@neondatabase/serverless"

type NeonClient = ReturnType<typeof neon>

let sqlClient: NeonClient | null = null

function normalizeResult(result: any) {
  if (Array.isArray(result)) {
    return result
  }

  if (result && typeof result === "object") {
    if (Array.isArray(result.rows)) {
      return result.rows
    }
    if (Array.isArray(result[0])) {
      return result[0]
    }
  }

  return result
}

function getSql() {
  if (sqlClient) return sqlClient

  const databaseUrl =
    process.env.NEON_NEON_DATABASE_URL ||
    process.env.NEON_NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_POSTGRES_URL

  if (!databaseUrl) {
    throw new Error(
      "Database URL not found. Please set NEON_DATABASE_URL, DATABASE_URL, or NEON_POSTGRES_URL environment variable.",
    )
  }

  console.log("[v0] Initializing database connection")
  sqlClient = neon(databaseUrl)
  return sqlClient
}

type SqlClient = NeonClient & {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>
}

export const sql = new Proxy({} as NeonClient, {
  get(target, prop) {
    const client = getSql()
    const value = client[prop as keyof typeof client]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
  apply(target, thisArg, args) {
    const client = getSql()
    const execution = (client as any)(...args)
    if (execution && typeof execution.then === "function") {
      return execution.then(normalizeResult)
    }
    return normalizeResult(execution)
  },
}) as SqlClient
