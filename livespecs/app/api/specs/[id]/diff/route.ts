import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import yaml from "js-yaml"
import { type NextRequest, NextResponse } from "next/server"

interface DiffChange {
  type: "added" | "removed" | "modified"
  path: string
  oldValue?: any
  newValue?: any
  description: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { versionId, compareContent } = await request.json()

    let oldContent: string
    let newContent: string

    if (versionId) {
      // Compare with a specific version
      const versionRows = (await sql<{ content: string }>`
        SELECT content FROM spec_versions
        WHERE id = ${versionId} AND spec_id = ${id}
      `) as { content: string }[]
      if (versionRows.length === 0) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 })
      }
      oldContent = versionRows[0].content

      const currentRows = (await sql<{ content: string }>`SELECT content FROM specs WHERE id = ${id}`) as {
        content: string
      }[]
      newContent = currentRows[0]?.content ?? ""
    } else if (compareContent) {
      // Compare with provided content
      const currentRows = (await sql<{ content: string }>`SELECT content FROM specs WHERE id = ${id}`) as {
        content: string
      }[]
      oldContent = currentRows[0]?.content ?? ""
      newContent = compareContent
    } else {
      return NextResponse.json({ error: "Version ID or compare content required" }, { status: 400 })
    }

    const oldSpec = yaml.load(oldContent) as any
    const newSpec = yaml.load(newContent) as any

    const changes = compareSpecs(oldSpec, newSpec)

    return NextResponse.json({
      changes,
      summary: {
        added: changes.filter((c) => c.type === "added").length,
        removed: changes.filter((c) => c.type === "removed").length,
        modified: changes.filter((c) => c.type === "modified").length,
      },
    })
  } catch (error) {
    console.error("Diff failed:", error)
    return NextResponse.json({ error: "Diff failed" }, { status: 500 })
  }
}

function compareSpecs(oldSpec: any, newSpec: any): DiffChange[] {
  const changes: DiffChange[] = []

  // Compare info
  if (oldSpec.info?.version !== newSpec.info?.version) {
    changes.push({
      type: "modified",
      path: "info.version",
      oldValue: oldSpec.info?.version,
      newValue: newSpec.info?.version,
      description: `Version changed from ${oldSpec.info?.version} to ${newSpec.info?.version}`,
    })
  }

  // Compare paths
  const oldPaths = Object.keys(oldSpec.paths || {})
  const newPaths = Object.keys(newSpec.paths || {})

  // Added paths
  for (const path of newPaths) {
    if (!oldPaths.includes(path)) {
      changes.push({
        type: "added",
        path: `paths.${path}`,
        newValue: newSpec.paths[path],
        description: `Added endpoint ${path}`,
      })
    } else {
      // Compare methods within path
      const oldMethods = Object.keys(oldSpec.paths[path] || {})
      const newMethods = Object.keys(newSpec.paths[path] || {})

      for (const method of newMethods) {
        if (!oldMethods.includes(method)) {
          changes.push({
            type: "added",
            path: `paths.${path}.${method}`,
            newValue: newSpec.paths[path][method],
            description: `Added ${method.toUpperCase()} method to ${path}`,
          })
        } else if (JSON.stringify(oldSpec.paths[path][method]) !== JSON.stringify(newSpec.paths[path][method])) {
          changes.push({
            type: "modified",
            path: `paths.${path}.${method}`,
            oldValue: oldSpec.paths[path][method],
            newValue: newSpec.paths[path][method],
            description: `Modified ${method.toUpperCase()} ${path}`,
          })
        }
      }

      for (const method of oldMethods) {
        if (!newMethods.includes(method)) {
          changes.push({
            type: "removed",
            path: `paths.${path}.${method}`,
            oldValue: oldSpec.paths[path][method],
            description: `Removed ${method.toUpperCase()} method from ${path}`,
          })
        }
      }
    }
  }

  // Removed paths
  for (const path of oldPaths) {
    if (!newPaths.includes(path)) {
      changes.push({
        type: "removed",
        path: `paths.${path}`,
        oldValue: oldSpec.paths[path],
        description: `Removed endpoint ${path}`,
      })
    }
  }

  // Compare schemas
  const oldSchemas = Object.keys(oldSpec.components?.schemas || {})
  const newSchemas = Object.keys(newSpec.components?.schemas || {})

  for (const schema of newSchemas) {
    if (!oldSchemas.includes(schema)) {
      changes.push({
        type: "added",
        path: `components.schemas.${schema}`,
        newValue: newSpec.components.schemas[schema],
        description: `Added schema ${schema}`,
      })
    } else if (
      JSON.stringify(oldSpec.components.schemas[schema]) !== JSON.stringify(newSpec.components.schemas[schema])
    ) {
      changes.push({
        type: "modified",
        path: `components.schemas.${schema}`,
        oldValue: oldSpec.components.schemas[schema],
        newValue: newSpec.components.schemas[schema],
        description: `Modified schema ${schema}`,
      })
    }
  }

  for (const schema of oldSchemas) {
    if (!newSchemas.includes(schema)) {
      changes.push({
        type: "removed",
        path: `components.schemas.${schema}`,
        oldValue: oldSpec.components.schemas[schema],
        description: `Removed schema ${schema}`,
      })
    }
  }

  return changes
}
