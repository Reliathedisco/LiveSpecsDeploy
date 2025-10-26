"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sparkles, Plus, X } from "lucide-react"
import toast from "react-hot-toast"

interface AISpecGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (spec: string) => void
}

export function AISpecGenerator({ open, onOpenChange, onGenerated }: AISpecGeneratorProps) {
  const [description, setDescription] = useState("")
  const [endpoints, setEndpoints] = useState<string[]>([])
  const [newEndpoint, setNewEndpoint] = useState("")
  const [includeExamples, setIncludeExamples] = useState(true)
  const [generating, setGenerating] = useState(false)

  async function generateSpec() {
    if (!description.trim()) {
      toast.error("Please provide a description")
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          endpoints: endpoints.length > 0 ? endpoints : undefined,
          includeExamples,
        }),
      })

      if (response.ok) {
        const { spec } = await response.json()
        onGenerated(spec)
        onOpenChange(false)
        toast.success("Spec generated!")
        resetForm()
      } else {
        toast.error("Failed to generate spec")
      }
    } catch (error) {
      console.error("Failed to generate spec:", error)
      toast.error("Failed to generate spec")
    } finally {
      setGenerating(false)
    }
  }

  function addEndpoint() {
    if (newEndpoint.trim()) {
      setEndpoints([...endpoints, newEndpoint.trim()])
      setNewEndpoint("")
    }
  }

  function removeEndpoint(index: number) {
    setEndpoints(endpoints.filter((_, i) => i !== index))
  }

  function resetForm() {
    setDescription("")
    setEndpoints([])
    setNewEndpoint("")
    setIncludeExamples(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Spec Generator
          </DialogTitle>
          <DialogDescription>
            Describe your API and let AI generate a complete OpenAPI specification for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">API Description</Label>
            <Textarea
              id="description"
              placeholder="E.g., A REST API for managing user accounts with authentication, CRUD operations, and profile management..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] mt-2"
            />
          </div>

          <div>
            <Label>Endpoints (Optional)</Label>
            <div className="space-y-2 mt-2">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={endpoint} readOnly className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeEndpoint(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="E.g., GET /users, POST /auth/login"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addEndpoint()}
                />
                <Button variant="outline" size="sm" onClick={addEndpoint}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="examples"
              checked={includeExamples}
              onCheckedChange={(checked) => setIncludeExamples(!!checked)}
            />
            <Label htmlFor="examples" className="text-sm font-normal cursor-pointer">
              Include example request/response bodies
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={generateSpec} disabled={generating} className="flex-1">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Spec
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
