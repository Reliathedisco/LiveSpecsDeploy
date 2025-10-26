import { auth } from "@clerk/nextjs/server"
import yaml from "js-yaml"
import { type NextRequest, NextResponse } from "next/server"

interface ValidationError {
  line?: number
  message: string
  severity: "error" | "warning" | "info"
  path?: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const errors: ValidationError[] = []
    let spec: any

    // Parse YAML
    try {
      spec = yaml.load(content)
    } catch (error: any) {
      return NextResponse.json({
        valid: false,
        errors: [
          {
            message: `YAML parsing error: ${error.message}`,
            severity: "error" as const,
            line: error.mark?.line,
          },
        ],
      })
    }

    // Validate OpenAPI structure
    if (!spec.openapi && !spec.swagger) {
      errors.push({
        message: "Missing OpenAPI or Swagger version",
        severity: "error",
        path: "openapi",
      })
    }

    if (!spec.info) {
      errors.push({
        message: "Missing info object",
        severity: "error",
        path: "info",
      })
    } else {
      if (!spec.info.title) {
        errors.push({
          message: "Missing API title",
          severity: "error",
          path: "info.title",
        })
      }
      if (!spec.info.version) {
        errors.push({
          message: "Missing API version",
          severity: "error",
          path: "info.version",
        })
      }
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push({
        message: "No paths defined",
        severity: "warning",
        path: "paths",
      })
    } else {
      // Validate paths
      for (const [path, methods] of Object.entries(spec.paths)) {
        if (!path.startsWith("/")) {
          errors.push({
            message: `Path "${path}" should start with /`,
            severity: "error",
            path: `paths.${path}`,
          })
        }

        const methodsRecord = methods as Record<string, any>
        for (const [method, operation] of Object.entries(methodsRecord)) {
          if (!["get", "post", "put", "delete", "patch", "options", "head"].includes(method)) {
            continue
          }

          if (!operation.responses) {
            errors.push({
              message: `Missing responses for ${method.toUpperCase()} ${path}`,
              severity: "error",
              path: `paths.${path}.${method}.responses`,
            })
          }

          if (!operation.summary && !operation.description) {
            errors.push({
              message: `Missing summary or description for ${method.toUpperCase()} ${path}`,
              severity: "warning",
              path: `paths.${path}.${method}`,
            })
          }

          // Check for security on sensitive operations
          if (["post", "put", "delete", "patch"].includes(method) && !operation.security && !spec.security) {
            errors.push({
              message: `Consider adding security to ${method.toUpperCase()} ${path}`,
              severity: "info",
              path: `paths.${path}.${method}.security`,
            })
          }
        }
      }
    }

    // Validate components/schemas
    if (spec.components?.schemas) {
      for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
        if (!(schema as any).type && !(schema as any).allOf && !(schema as any).oneOf && !(schema as any).anyOf) {
          errors.push({
            message: `Schema "${schemaName}" missing type definition`,
            severity: "warning",
            path: `components.schemas.${schemaName}`,
          })
        }
      }
    }

    // Check for common best practices
    if (!spec.servers || spec.servers.length === 0) {
      errors.push({
        message: "No servers defined - consider adding server URLs",
        severity: "info",
        path: "servers",
      })
    }

    if (!spec.tags || spec.tags.length === 0) {
      errors.push({
        message: "No tags defined - consider organizing endpoints with tags",
        severity: "info",
        path: "tags",
      })
    }

    return NextResponse.json({
      valid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
      warnings: errors.filter((e) => e.severity === "warning").length,
      info: errors.filter((e) => e.severity === "info").length,
    })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
