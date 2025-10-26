"use client"

import { use, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Code, FileText } from "lucide-react"

interface Spec {
  id: string
  name: string
  content: string
}

export default function DocsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [spec, setSpec] = useState<Spec | null>(null)
  const [parsedSpec, setParsedSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpec()
  }, [resolvedParams.id])

  async function fetchSpec() {
    try {
      const response = await fetch(`/api/specs/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setSpec(data)

        // Parse YAML content
        const yaml = require("js-yaml")
        const parsed = yaml.load(data.content)
        setParsedSpec(parsed)
      }
    } catch (error) {
      console.error("Failed to fetch spec:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading documentation...</div>
      </div>
    )
  }

  if (!spec || !parsedSpec) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Documentation not found</div>
      </div>
    )
  }

  const info = parsedSpec.info || {}
  const paths = parsedSpec.paths || {}

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{info.title || spec.name}</h1>
              {info.version && <Badge variant="secondary">v{info.version}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/${spec.id}`}>
                  <Code className="h-4 w-4 mr-2" />
                  Edit Spec
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/specs/${spec.id}/export`} download>
                  <FileText className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
          {info.description && <p className="mt-2 text-muted-foreground">{info.description}</p>}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Endpoints</h3>
                  <div className="space-y-1">
                    {Object.keys(paths).map((path) => (
                      <a
                        key={path}
                        href={`#${path.replace(/\//g, "-")}`}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        {path}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </aside>

          <main className="lg:col-span-3">
            <div className="space-y-8">
              {Object.entries(paths).map(([path, methods]: [string, any]) => (
                <Card key={path} id={path.replace(/\//g, "-")} className="p-6">
                  <h2 className="text-xl font-bold mb-4">{path}</h2>
                  <div className="space-y-6">
                    {Object.entries(methods).map(([method, details]: [string, any]) => {
                      if (!["get", "post", "put", "delete", "patch"].includes(method)) return null

                      const methodColors: Record<string, string> = {
                        get: "bg-blue-500",
                        post: "bg-green-500",
                        put: "bg-orange-500",
                        delete: "bg-red-500",
                        patch: "bg-purple-500",
                      }

                      return (
                        <div key={method} className="border-l-4 pl-4" style={{ borderColor: methodColors[method] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={methodColors[method]}>{method.toUpperCase()}</Badge>
                            <code className="text-sm font-mono">{path}</code>
                          </div>
                          {details.summary && <p className="text-sm font-medium mb-2">{details.summary}</p>}
                          {details.description && (
                            <p className="text-sm text-muted-foreground mb-4">{details.description}</p>
                          )}

                          <Tabs defaultValue="request" className="w-full">
                            <TabsList>
                              <TabsTrigger value="request">Request</TabsTrigger>
                              <TabsTrigger value="response">Response</TabsTrigger>
                            </TabsList>
                            <TabsContent value="request" className="space-y-4">
                              {details.parameters && details.parameters.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                                  <div className="space-y-2">
                                    {details.parameters.map((param: any, idx: number) => (
                                      <div key={idx} className="text-sm">
                                        <code className="font-mono">{param.name}</code>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {param.in}
                                        </Badge>
                                        {param.required && (
                                          <Badge variant="destructive" className="ml-2 text-xs">
                                            required
                                          </Badge>
                                        )}
                                        {param.description && (
                                          <p className="text-muted-foreground mt-1">{param.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {details.requestBody && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                    {JSON.stringify(details.requestBody, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="response" className="space-y-4">
                              {details.responses &&
                                Object.entries(details.responses).map(([code, response]: [string, any]) => (
                                  <div key={code}>
                                    <h4 className="text-sm font-semibold mb-2">
                                      Status {code}: {response.description}
                                    </h4>
                                    {response.content && (
                                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                        {JSON.stringify(response.content, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                ))}
                            </TabsContent>
                          </Tabs>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
