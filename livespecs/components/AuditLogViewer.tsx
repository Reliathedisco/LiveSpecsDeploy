"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Search } from "lucide-react"

interface AuditLog {
  id: string
  user_name: string
  user_email: string
  action: string
  resource_type: string
  spec_name?: string
  metadata?: any
  ip_address?: string
  created_at: string
}

export function AuditLogViewer({ specId }: { specId?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [specId, actionFilter])

  async function fetchLogs() {
    try {
      const params = new URLSearchParams()
      if (specId) params.append("specId", specId)
      if (actionFilter !== "all") params.append("action", actionFilter)

      const response = await fetch(`/api/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (action.includes("delete")) return "bg-red-500/10 text-red-500 border-red-500/20"
    if (action.includes("update")) return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Audit Logs</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">Loading audit logs...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">No audit logs found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                    <span className="text-sm font-medium">{log.user_name || log.user_email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.resource_type}
                  {log.spec_name && ` - ${log.spec_name}`}
                </div>
                {log.ip_address && <div className="text-xs text-muted-foreground mt-1">IP: {log.ip_address}</div>}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
