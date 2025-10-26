import { sql } from "@/lib/db";
import yaml from "js-yaml";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  return handleMockRequest(request, params, "get")
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  return handleMockRequest(request, params, "post")
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  return handleMockRequest(request, params, "put")
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  return handleMockRequest(request, params, "delete")
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  return handleMockRequest(request, params, "patch")
}

async function handleMockRequest(
  request: NextRequest,
  params: Promise<{ id: string; path: string[] }>,
  method: string,
) {
  try {
    const { id, path } = await params
    const fullPath = `/${path.join("/")}`

    const specRows = (await sql<{ content: string }>`SELECT content FROM specs WHERE id = ${id}`) as {
      content: string
    }[]
    const spec = specRows[0]
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 })
    }

    const parsedSpec = yaml.load(spec.content) as any

    if (!parsedSpec.paths || !parsedSpec.paths[fullPath]) {
      return NextResponse.json({ error: "Path not found in spec" }, { status: 404 })
    }

    const operation = parsedSpec.paths[fullPath][method]
    if (!operation) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    // Generate mock response based on schema
    const responses = operation.responses
    const successResponse = responses["200"] || responses["201"] || responses["204"]

    if (!successResponse) {
      return NextResponse.json({ message: "Success" }, { status: 200 })
    }

    const content = successResponse.content?.["application/json"]
    if (!content || !content.schema) {
      return NextResponse.json({ message: successResponse.description || "Success" }, { status: 200 })
    }

    const mockData = generateMockFromSchema(content.schema, parsedSpec.components?.schemas)

    return NextResponse.json(mockData, { status: 200 })
  } catch (error) {
    console.error("Mock server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateMockFromSchema(schema: any, components?: any): any {
  if (schema.$ref) {
    const refPath = schema.$ref.split("/")
    const schemaName = refPath[refPath.length - 1]
    if (components && components[schemaName]) {
      return generateMockFromSchema(components[schemaName], components)
    }
  }

  if (schema.type === "object") {
    const obj: any = {}
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        obj[key] = generateMockFromSchema(prop as any, components)
      }
    }
    return obj
  }

  if (schema.type === "array") {
    return [generateMockFromSchema(schema.items, components)]
  }

  if (schema.type === "string") {
    if (schema.format === "email") return "user@example.com"
    if (schema.format === "date-time") return new Date().toISOString()
    if (schema.format === "uuid") return "123e4567-e89b-12d3-a456-426614174000"
    if (schema.enum) return schema.enum[0]
    return schema.example || "string"
  }

  if (schema.type === "number" || schema.type === "integer") {
    return schema.example || 0
  }

  if (schema.type === "boolean") {
    return schema.example || false
  }

  return null
}
