import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spec, improvements } = await request.json()

    if (!spec) {
      return NextResponse.json({ error: "Spec is required" }, { status: 400 })
    }

    const prompt = `Improve this OpenAPI specification:

${spec}

Focus on these improvements:
${improvements.join("\n")}

Return the improved YAML specification with:
- Better descriptions and documentation
- Proper error responses
- Consistent naming conventions
- Complete schema definitions
- Security best practices

Return ONLY the improved YAML specification, no explanations.`

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      temperature: 0.5,
    })

    return NextResponse.json({ spec: text })
  } catch (error) {
    console.error("Failed to improve spec:", error)
    return NextResponse.json({ error: "Failed to improve spec" }, { status: 500 })
  }
}
