"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Plus, X } from "lucide-react"
import toast from "react-hot-toast"

interface TestResult {
  success: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  body: any
  duration: number
  validation?: {
    valid: boolean
    issues: string[]
  }
}

export function APITester({ specId }: { specId: string }) {
  const [method, setMethod] = useState("GET")
  const [path, setPath] = useState("/")
  const [baseUrl, setBaseUrl] = useState("")
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([])
  const [body, setBody] = useState("")
  const [result, setResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)

  async function runTest() {
    setTesting(true)
    try {
      const response = await fetch(`/api/specs/${specId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          path,
          baseUrl: baseUrl || undefined,
          headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
          body: body ? JSON.parse(body) : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        if (data.success) {
          toast.success("Request successful")
        } else {
          toast.error("Request failed")
        }
      } else {
        toast.error("Test failed")
      }
    } catch (error) {
      console.error("Test failed:", error)
      toast.error("Test failed")
    } finally {
      setTesting(false)
    }
  }

  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }])
  }

  function updateHeader(index: number, field: "key" | "value", value: string) {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  function removeHeader(index: number) {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="/endpoint" value={path} onChange={(e) => setPath(e.target.value)} className="flex-1" />
        <Button onClick={runTest} disabled={testing}>
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>

      <div>
        <Label>Base URL (optional)</Label>
        <Input
          placeholder="https://api.example.com"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="mt-2"
        />
      </div>

      <Tabs defaultValue="headers">
        <TabsList>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="headers" className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={header.key}
                onChange={(e) => updateHeader(index, "key", e.target.value)}
              />
              <Input
                placeholder="Header value"
                value={header.value}
                onChange={(e) => updateHeader(index, "value", e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => removeHeader(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addHeader}>
            <Plus className="h-4 w-4 mr-2" />
            Add Header
          </Button>
        </TabsContent>
        <TabsContent value="body">
          <Textarea
            placeholder='{"key": "value"}'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
          />
        </TabsContent>
      </Tabs>

      {result && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={result.success ? "secondary" : "destructive"}>
                {result.status} {result.statusText}
              </Badge>
              <span className="text-sm text-muted-foreground">{result.duration}ms</span>
            </div>
            {result.validation && (
              <Badge variant={result.validation.valid ? "secondary" : "destructive"}>
                {result.validation.valid ? "Valid" : "Invalid"}
              </Badge>
            )}
          </div>

          {result.validation && !result.validation.valid && (
            <div className="space-y-1">
              {result.validation.issues.map((issue, index) => (
                <p key={index} className="text-sm text-destructive">
                  {issue}
                </p>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Response Body</Label>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
