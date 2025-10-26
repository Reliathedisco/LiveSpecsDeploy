import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import yaml from "js-yaml"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { method, path, headers, body, baseUrl } = await request.json()

    if (!method || !path) {
      return NextResponse.json({ error: "Method and path are required" }, { status: 400 })
    }

    // Get spec to validate against
    const specRows = (await sql<{ content: string }>`SELECT content FROM specs WHERE id = ${id}`) as {
      content: string
    }[]
    const spec = specRows[0]
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 })
    }

    const parsedSpec = yaml.load(spec.content) as any
    const url = baseUrl ? `${baseUrl}${path}` : `http://localhost:5000/api/mock/${id}${path}`

    const startTime = Date.now()
    let response: Response
    let error: string | null = null

    try {
      response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err: any) {
      error = err.message
      return NextResponse.json({
        success: false,
        error: error,
        duration: Date.now() - startTime,
      })
    }

    const duration = Date.now() - startTime
    const responseBody = await response.text()
    let parsedBody: any

    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = responseBody
    }

    // Validate response against spec
    const validation = validateResponse(parsedSpec, path, method.toLowerCase(), response.status, parsedBody)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
      duration,
      validation,
    })
  } catch (error) {
    console.error("Test failed:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}

function validateResponse(spec: any, path: string, method: string, status: number, body: any) {
  const issues: string[] = []

  if (!spec.paths || !spec.paths[path]) {
    issues.push(`Path ${path} not found in spec`)
    return { valid: false, issues }
  }

  const operation = spec.paths[path][method]
  if (!operation) {
    issues.push(`Method ${method.toUpperCase()} not defined for ${path}`)
    return { valid: false, issues }
  }

  const responses = operation.responses
  if (!responses || !responses[status.toString()]) {
    issues.push(`Status ${status} not defined in spec for ${method.toUpperCase()} ${path}`)
  }

  // Basic schema validation could be added here
  if (responses && responses[status.toString()]?.content?.["application/json"]?.schema) {
    // Schema validation logic
    issues.push("Schema validation not yet implemented")
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
