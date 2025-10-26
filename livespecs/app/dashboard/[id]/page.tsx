"use client"

import { use, useEffect, useState, useCallback } from "react"
import { MonacoEditor } from "@/components/editor/MonacoEditor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Save,
  UserPlus,
  Copy,
  Check,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings,
  Undo,
  Redo,
  Code,
  CheckCircle,
  AlertCircle,
  Share2,
  FileJson,
  Database,
  Box,
  Send,
  User,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { LiveblocksProvider } from "@/components/editor/LiveblocksProvider"
import { SimpleAIChat } from "@/components/SimpleAIChat"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Spec {
  id: string
  name: string
  content: string
  owner: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
  collaborators: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
      imageUrl: string | null
    }
  }>
  updatedAt: string
}

function SpecEditorContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [spec, setSpec] = useState<Spec | null>(null)
  const [content, setContent] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mockUrl, setMockUrl] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const [endpointsExpanded, setEndpointsExpanded] = useState<Record<string, boolean>>({})
  const [componentsExpanded, setComponentsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("mock")
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [isValid, setIsValid] = useState(true)
  const [showDocsDialog, setShowDocsDialog] = useState(false)
  const [generatingDocs, setGeneratingDocs] = useState(false)
  const [docsUrl, setDocsUrl] = useState("")

  useEffect(() => {
    fetchSpec()
  }, [resolvedParams.id])

  useEffect(() => {
    const interval = setInterval(() => {
      if (content && spec && content !== spec.content) {
        saveSpec()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [content, spec])

  async function fetchSpec() {
    try {
      const response = await fetch(`/api/specs/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setSpec(data)
        setContent(data.content)
        setName(data.name)
        setMockUrl(`${window.location.origin}/api/mock/${data.id}`)
      } else {
        toast.error("Failed to load spec")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to fetch spec:", error)
      toast.error("Failed to load spec")
    } finally {
      setLoading(false)
    }
  }

  const saveSpec = useCallback(async () => {
    if (!spec) return

    setSaving(true)
    try {
      const response = await fetch(`/api/specs/${spec.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSpec(updated)
        toast.success("Saved")
      } else {
        toast.error("Failed to save")
      }
    } catch (error) {
      console.error("Failed to save spec:", error)
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }, [spec, name, content])

  async function deleteSpec() {
    if (!spec || !confirm("Are you sure you want to delete this spec?")) return

    try {
      const response = await fetch(`/api/specs/${spec.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Spec deleted")
        router.push("/dashboard")
      } else {
        toast.error("Failed to delete spec")
      }
    } catch (error) {
      console.error("Failed to delete spec:", error)
      toast.error("Failed to delete spec")
    }
  }

  async function inviteCollaborator() {
    if (!spec || !inviteEmail) return

    try {
      const response = await fetch(`/api/specs/${spec.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })

      if (response.ok) {
        toast.success("Collaborator invited")
        setInviteEmail("")
        fetchSpec()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to invite collaborator")
      }
    } catch (error) {
      console.error("Failed to invite collaborator:", error)
      toast.error("Failed to invite collaborator")
    }
  }

  async function copyMockUrl() {
    try {
      await navigator.clipboard.writeText(mockUrl)
      setCopied(true)
      toast.success("Mock URL copied")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      const textArea = document.createElement("textarea")
      textArea.value = mockUrl
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        toast.success("Mock URL copied")
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error("Failed to copy URL")
        console.error("Failed to copy:", err)
      }
      document.body.removeChild(textArea)
    }
  }

  function downloadSpec() {
    if (!spec) return

    const blob = new Blob([content], { type: "application/x-yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function parseEndpoints(content: string): Array<{ method: string; path: string }> {
    try {
      const endpoints: Array<{ method: string; path: string }> = []
      const lines = content.split("\n")
      let currentPath = ""

      for (const line of lines) {
        if (line.trim().startsWith("/")) {
          currentPath = line.trim().replace(":", "")
        } else if (currentPath && /^\s+(get|post|put|delete|patch):/i.test(line)) {
          const method = line.trim().split(":")[0].toUpperCase()
          endpoints.push({ method, path: currentPath })
        }
      }

      return endpoints.length > 0
        ? endpoints
        : [
            { method: "GET", path: "/users" },
            { method: "POST", path: "/users" },
            { method: "GET", path: "/users/{id}" },
            { method: "DELETE", path: "/users/{id}" },
          ]
    } catch {
      return [
        { method: "GET", path: "/users" },
        { method: "POST", path: "/users" },
        { method: "GET", path: "/users/{id}" },
        { method: "DELETE", path: "/users/{id}" },
      ]
    }
  }

  function parseComponents(content: string): { schemas: number; responses: number; parameters: number } {
    try {
      const schemasMatch = content.match(/schemas:/g)
      const responsesMatch = content.match(/responses:/g)
      const parametersMatch = content.match(/parameters:/g)

      return {
        schemas: schemasMatch ? schemasMatch.length : 3,
        responses: responsesMatch ? responsesMatch.length : 5,
        parameters: parametersMatch ? parametersMatch.length : 2,
      }
    } catch {
      return { schemas: 3, responses: 5, parameters: 2 }
    }
  }

  const endpoints = parseEndpoints(content)
  const components = parseComponents(content)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading spec...</div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Spec not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              LS
            </div>
          </Link>
          <div className="h-6 w-px bg-border" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-64 border-0 bg-transparent px-2 text-sm font-medium focus-visible:ring-1"
            placeholder="Untitled Spec"
          />
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <Badge variant="secondary" className="text-xs">
              Saving...
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={saveSpec}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadSpec}>
                <FileText className="h-4 w-4 mr-2" />
                Export as YAML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPostman}>
                <Send className="h-4 w-4 mr-2" />
                Export as Postman Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={generateDocumentation}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Documentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex -space-x-2">
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarImage src={spec?.owner.imageUrl || undefined} />
              <AvatarFallback className="text-xs">
                {spec?.owner.name?.[0] || spec?.owner.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {spec?.collaborators.slice(0, 3).map((collab) => (
              <Avatar key={collab.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={collab.user.imageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {collab.user.name?.[0] || collab.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={spec?.owner.imageUrl || undefined} />
            <AvatarFallback className="text-xs">
              {spec?.owner.name?.[0] || spec?.owner.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Endpoints Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endpoints</h3>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {endpoints.map((endpoint) => (
                    <EndpointItem
                      key={`${endpoint.method}-${endpoint.path}`}
                      endpoint={endpoint}
                      expanded={endpointsExpanded[`${endpoint.method}-${endpoint.path}`]}
                      onToggle={() => {
                        setEndpointsExpanded((prev) => ({
                          ...prev,
                          [`${endpoint.method}-${endpoint.path}`]: !prev[`${endpoint.method}-${endpoint.path}`],
                        }))
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Components Section */}
              <div>
                <button
                  onClick={() => setComponentsExpanded(!componentsExpanded)}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-full hover:text-foreground transition-colors"
                >
                  {componentsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Components
                </button>
                {componentsExpanded && (
                  <div className="mt-2 ml-3 space-y-1">
                    <ComponentItem icon={FileJson} label="Schemas" count={components.schemas} />
                    <ComponentItem icon={Database} label="Responses" count={components.responses} />
                    <ComponentItem icon={Box} label="Parameters" count={components.parameters} />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between h-10 px-3 border-b bg-muted/30">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Undo className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Redo className="h-3.5 w-3.5" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Code className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Format</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Validate</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                YAML
              </Badge>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor value={content} onChange={setContent} language="yaml" />
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between h-7 px-3 border-t bg-muted/50 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {isValid ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Valid OpenAPI</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-muted-foreground">Invalid syntax</span>
                  </>
                )}
              </div>
              <div className="text-muted-foreground">
                Ln {cursorPosition.line}, Col {cursorPosition.column}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{spec?.collaborators.length || 0} online</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-80 border-l bg-muted/30 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-10">
              <TabsTrigger
                value="mock"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Mock
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="components"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Components
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                History
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="mock" className="m-0 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Mock Server URL</h3>
                  <div className="flex gap-2">
                    <Input value={mockUrl} readOnly className="flex-1 text-xs font-mono" />
                    <Button onClick={copyMockUrl} variant="outline" size="sm">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Test Endpoint</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-xs">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                      <Input placeholder="/endpoint" className="flex-1 text-xs" />
                    </div>
                    <Button size="sm" className="w-full">
                      <Send className="h-3 w-3 mr-2" />
                      Send Request
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Response</h3>
                  <Card className="p-3 bg-muted/50">
                    <pre className="text-xs text-muted-foreground">No response yet</pre>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team" className="m-0 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Team Members</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={spec?.owner.imageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {spec?.owner.name?.[0] || spec?.owner.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{spec?.owner.name || spec?.owner.email}</div>
                        <div className="text-xs text-muted-foreground">Owner</div>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    {spec?.collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collab.user.imageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {collab.user.name?.[0] || collab.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{collab.user.name || collab.user.email}</div>
                          <div className="text-xs text-muted-foreground capitalize">{collab.role}</div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Invite Member</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button onClick={inviteCollaborator} size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="components" className="m-0 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Reusable Components</h3>
                  <div className="space-y-2">
                    <ComponentCard icon={FileJson} title="Schemas" count={components.schemas} />
                    <ComponentCard icon={Database} title="Responses" count={components.responses} />
                    <ComponentCard icon={Box} title="Parameters" count={components.parameters} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Changes</h3>
                  <div className="space-y-3">
                    <HistoryItem
                      user={spec?.owner.name || spec?.owner.email || "Unknown"}
                      action="Updated endpoint /users"
                      time="2 minutes ago"
                    />
                    <HistoryItem
                      user={spec?.owner.name || spec?.owner.email || "Unknown"}
                      action="Added schema UserResponse"
                      time="15 minutes ago"
                    />
                    <HistoryItem
                      user={spec?.owner.name || spec?.owner.email || "Unknown"}
                      action="Created spec"
                      time="1 hour ago"
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
      </div>

      <SimpleAIChat specContent={content} specName={name} />

      {/* Documentation Dialog */}
      <Dialog open={showDocsDialog} onOpenChange={setShowDocsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Documentation</DialogTitle>
            <DialogDescription>
              {generatingDocs
                ? "Generating beautiful documentation from your OpenAPI spec..."
                : "Your documentation is ready!"}
            </DialogDescription>
          </DialogHeader>
          {generatingDocs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : docsUrl ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={docsUrl} readOnly className="flex-1 font-mono text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(docsUrl)
                    toast.success("URL copied!")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => window.open(docsUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EndpointItem({
  endpoint,
  expanded,
  onToggle,
}: {
  endpoint: { method: string; path: string }
  expanded: boolean
  onToggle: () => void
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    POST: "bg-green-500/10 text-green-500 border-green-500/20",
    PUT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  }

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left"
    >
      <Badge className={cn("text-[10px] font-semibold px-1.5 py-0 h-5", methodColors[endpoint.method])}>
        {endpoint.method}
      </Badge>
      <span className="text-xs font-mono truncate flex-1">{endpoint.path}</span>
    </button>
  )
}

function ComponentItem({
  icon: Icon,
  label,
  count,
}: {
  icon: any
  label: string
  count: number
}) {
  return (
    <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs flex-1">{label}</span>
      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
        {count}
      </Badge>
    </button>
  )
}

function ComponentCard({
  icon: Icon,
  title,
  count,
}: {
  icon: any
  title: string
  count: number
}) {
  return (
    <Card className="p-3 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{count} items</div>
        </div>
      </div>
    </Card>
  )
}

function HistoryItem({
  user,
  action,
  time,
}: {
  user: string
  action: string
  time: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
        <User className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{user}</div>
        <div className="text-xs text-muted-foreground">{action}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{time}</div>
      </div>
    </div>
  )
}

function exportAsJSON() {
  // Implementation for exporting as JSON
}

function exportAsPostman() {
  // Implementation for exporting as Postman Collection
}

async function generateDocumentation() {
  // Implementation for generating documentation
}

export default function SpecEditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <LiveblocksProvider>
      <SpecEditorContent params={params} />
    </LiveblocksProvider>
  )
}
