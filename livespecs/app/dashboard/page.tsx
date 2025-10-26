"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, FileText, Clock, Users, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Spec {
  id: string
  name: string
  updatedAt: string
  _count?: {
    collaborators: number
  }
}

export default function DashboardPage() {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importContent, setImportContent] = useState("")

  useEffect(() => {
    fetchSpecs()
  }, [])

  async function fetchSpecs() {
    try {
      const response = await fetch("/api/specs/list")
      if (response.ok) {
        const data = await response.json()
        setSpecs(data)
      }
    } catch (error) {
      console.error("Failed to fetch specs:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createSpec() {
    try {
      const response = await fetch("/api/specs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Spec" }),
      })

      if (response.ok) {
        const newSpec = await response.json()
        window.location.href = `/dashboard/${newSpec.id}`
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create spec")
      }
    } catch (error) {
      console.error("Failed to create spec:", error)
      alert("Failed to create spec")
    }
  }

  async function importSpec(content: string, name?: string) {
    setImportLoading(true)
    try {
      let parsedSpec
      try {
        parsedSpec = JSON.parse(content)
      } catch {
        parsedSpec = content
      }

      const specName = name || parsedSpec?.info?.title || "Imported Spec"

      const response = await fetch("/api/specs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          name: specName,
        }),
      })

      if (response.ok) {
        const newSpec = await response.json()
        setImportDialogOpen(false)
        window.location.href = `/dashboard/${newSpec.id}`
      } else {
        const data = await response.json()
        alert(data.error || "Failed to import spec")
      }
    } catch (error) {
      console.error("Failed to import spec:", error)
      alert("Failed to import spec. Please check the format and try again.")
    } finally {
      setImportLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      await importSpec(content, file.name.replace(/\.(yaml|yml|json)$/, ""))
    }
    reader.readAsText(file)
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) {
      alert("Please enter a URL")
      return
    }

    setImportLoading(true)
    try {
      const response = await fetch(importUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch spec from URL")
      }
      const content = await response.text()
      await importSpec(content)
    } catch (error) {
      console.error("Failed to fetch spec:", error)
      alert("Failed to fetch spec from URL. Please check the URL and try again.")
      setImportLoading(false)
    }
  }

  async function handleContentImport() {
    if (!importContent.trim()) {
      alert("Please paste your spec content")
      return
    }
    await importSpec(importContent)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (specs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold">Create your first API spec</h1>
          <p className="mb-6 text-muted-foreground">
            Get started by creating your first OpenAPI specification. Collaborate with your team in real-time.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={createSpec} size="lg" className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              New Spec
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  <Upload className="mr-2 h-5 w-5" />
                  Import Spec
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import API Specification</DialogTitle>
                  <DialogDescription>
                    Import an existing OpenAPI/Swagger spec from a file, URL, or paste the content directly.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="file" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="url">From URL</TabsTrigger>
                    <TabsTrigger value="paste">Paste Content</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload YAML or JSON file</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".yaml,.yml,.json"
                        onChange={handleFileUpload}
                        disabled={importLoading}
                      />
                      <p className="text-sm text-muted-foreground">
                        Supports OpenAPI 3.0+ and Swagger 2.0 specifications
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Spec URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://api.example.com/openapi.yaml"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        disabled={importLoading}
                      />
                      <p className="text-sm text-muted-foreground">Enter a public URL to your OpenAPI specification</p>
                    </div>
                    <Button onClick={handleUrlImport} disabled={importLoading} className="w-full">
                      {importLoading ? "Importing..." : "Import from URL"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content">Paste your spec</Label>
                      <Textarea
                        id="content"
                        placeholder="Paste your OpenAPI YAML or JSON here..."
                        value={importContent}
                        onChange={(e) => setImportContent(e.target.value)}
                        disabled={importLoading}
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleContentImport} disabled={importLoading} className="w-full">
                      {importLoading ? "Importing..." : "Import Spec"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your API Specs</h1>
            <p className="text-muted-foreground">Manage and collaborate on your OpenAPI specifications</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-5 w-5" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import API Specification</DialogTitle>
                  <DialogDescription>
                    Import an existing OpenAPI/Swagger spec from a file, URL, or paste the content directly.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="file" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="url">From URL</TabsTrigger>
                    <TabsTrigger value="paste">Paste Content</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload YAML or JSON file</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".yaml,.yml,.json"
                        onChange={handleFileUpload}
                        disabled={importLoading}
                      />
                      <p className="text-sm text-muted-foreground">
                        Supports OpenAPI 3.0+ and Swagger 2.0 specifications
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Spec URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://api.example.com/openapi.yaml"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        disabled={importLoading}
                      />
                      <p className="text-sm text-muted-foreground">Enter a public URL to your OpenAPI specification</p>
                    </div>
                    <Button onClick={handleUrlImport} disabled={importLoading} className="w-full">
                      {importLoading ? "Importing..." : "Import from URL"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content">Paste your spec</Label>
                      <Textarea
                        id="content"
                        placeholder="Paste your OpenAPI YAML or JSON here..."
                        value={importContent}
                        onChange={(e) => setImportContent(e.target.value)}
                        disabled={importLoading}
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleContentImport} disabled={importLoading} className="w-full">
                      {importLoading ? "Importing..." : "Import Spec"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button onClick={createSpec}>
              <Plus className="mr-2 h-5 w-5" />
              New Spec
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <Link key={spec.id} href={`/dashboard/${spec.id}`}>
              <Card className="group cursor-pointer p-6 transition-all hover:border-primary hover:shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">{spec.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(spec.updatedAt), { addSuffix: true })}</span>
                  </div>
                  {spec._count && spec._count.collaborators > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{spec._count.collaborators}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
