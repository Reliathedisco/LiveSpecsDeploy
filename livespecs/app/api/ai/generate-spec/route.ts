import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@auth0/nextjs-auth0"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { description, endpoints, includeExamples } = await request.json()

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const prompt = `Generate a complete OpenAPI 3.0 specification in YAML format based on this description:

${description}

${endpoints ? `Include these endpoints: ${endpoints.join(", ")}` : ""}
${includeExamples ? "Include example request/response bodies for each endpoint." : ""}

Requirements:
- Use OpenAPI 3.0 format
- Include proper schemas in components section
- Add descriptions for all endpoints and parameters
- Use appropriate HTTP methods and status codes
- Include security schemes if authentication is mentioned
- Format as valid YAML

Return ONLY the YAML specification, no explanations.`

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      temperature: 0.7,
    })

    return NextResponse.json({ spec: text })
  } catch (error) {
    console.error("Failed to generate spec:", error)
    return NextResponse.json({ error: "Failed to generate spec" }, { status: 500 })
  }
}
