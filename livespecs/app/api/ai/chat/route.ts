import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { messages, specContent, specName } = await request.json()

    const lastMessage = messages[messages.length - 1]

    const systemPrompt = `You are an expert API design assistant specializing in OpenAPI/Swagger specifications. 
You help developers create, understand, and improve their API specifications.

Current spec being edited: ${specName}

Current spec content:
\`\`\`yaml
${specContent}
\`\`\`

Provide helpful, concise advice about:
- OpenAPI 3.0 specification syntax
- REST API best practices
- HTTP methods, status codes, and headers
- Schema definitions and data types
- API documentation and examples
- Common patterns and anti-patterns

Keep responses clear and actionable.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: lastMessage.content,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { error: "Failed to generate response", message: "Sorry, I encountered an error. Please try again." },
      { status: 500 },
    )
  }
}
