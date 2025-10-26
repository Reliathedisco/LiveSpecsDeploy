"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

interface ValidationError {
  line?: number
  message: string
  severity: "error" | "warning" | "info"
  path?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: number
  info: number
}

export function ValidationPanel({ specId, content }: { specId: string; content: string }) {
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (content) {
        validateSpec()
      }
    }, 1000)

    return () => clearTimeout(debounce)
  }, [content])

  async function validateSpec() {
    setValidating(true)
    try {
      const response = await fetch(`/api/specs/${specId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        toast.error("Validation failed")
      }
    } catch (error) {
      console.error("Validation error:", error)
      toast.error("Validation failed")
    } finally {
      setValidating(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-l-destructive"
      case "warning":
        return "border-l-orange-500"
      case "info":
        return "border-l-blue-500"
      default:
        return ""
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Validation</h3>
          <Button variant="ghost" size="sm" onClick={validateSpec} disabled={validating}>
            <RefreshCw className={`h-4 w-4 ${validating ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {result && (
          <div className="flex gap-2 mt-3">
            {result.valid ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                Invalid
              </Badge>
            )}
            {result.warnings > 0 && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/20">
                {result.warnings} warnings
              </Badge>
            )}
            {result.info > 0 && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/20">
                {result.info} suggestions
              </Badge>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {result && result.errors.length > 0 ? (
          <div className="space-y-2">
            {result.errors.map((error, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 bg-muted/30 ${getSeverityColor(error.severity)}`}>
                <div className="flex items-start gap-2">
                  {getSeverityIcon(error.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{error.message}</p>
                    {error.path && <p className="text-xs text-muted-foreground mt-1">Path: {error.path}</p>}
                    {error.line && <p className="text-xs text-muted-foreground">Line: {error.line}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : result ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">Spec is valid!</p>
            <p className="text-xs text-muted-foreground mt-1">No errors or warnings found</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">Validation results will appear here</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
