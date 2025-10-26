"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Github, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"

interface GitHubSyncProps {
  specId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GitHubSync({ specId, open, onOpenChange }: GitHubSyncProps) {
  const [repoOwner, setRepoOwner] = useState("")
  const [repoName, setRepoName] = useState("")
  const [filePath, setFilePath] = useState("openapi.yaml")
  const [branch, setBranch] = useState("main")
  const [autoSync, setAutoSync] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncConfig, setSyncConfig] = useState<any>(null)

  useEffect(() => {
    if (open) {
      fetchSyncConfig()
    }
  }, [open, specId])

  async function fetchSyncConfig() {
    try {
      const response = await fetch(`/api/specs/${specId}/github/sync`)
      if (response.ok) {
        const data = await response.json()
        if (data.connected) {
          setSyncConfig(data)
          setRepoOwner(data.repo_owner)
          setRepoName(data.repo_name)
          setFilePath(data.file_path)
          setBranch(data.branch)
          setAutoSync(data.auto_sync)
        }
      }
    } catch (error) {
      console.error("Failed to fetch sync config:", error)
    }
  }

  async function syncToGitHub() {
    if (!repoOwner || !repoName || !filePath) {
      toast.error("Please fill in all fields")
      return
    }

    setSyncing(true)
    try {
      const response = await fetch(`/api/specs/${specId}/github/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoOwner,
          repoName,
          filePath,
          branch,
          autoSync,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Synced to GitHub!")
        setSyncConfig({ connected: true, repo_owner: repoOwner, repo_name: repoName })
        if (data.url) {
          window.open(data.url, "_blank")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to sync")
      }
    } catch (error) {
      console.error("Sync failed:", error)
      toast.error("Failed to sync")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Sync
          </DialogTitle>
          <DialogDescription>
            {syncConfig?.connected ? "Update your GitHub sync configuration" : "Sync your spec to a GitHub repository"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {syncConfig?.connected && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Connected</Badge>
                <span className="text-sm">
                  {syncConfig.repo_owner}/{syncConfig.repo_name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(`https://github.com/${syncConfig.repo_owner}/${syncConfig.repo_name}`, "_blank")
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner">Repository Owner</Label>
              <Input
                id="owner"
                placeholder="username or org"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="repo">Repository Name</Label>
              <Input
                id="repo"
                placeholder="my-api"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="path">File Path</Label>
            <Input
              id="path"
              placeholder="openapi.yaml"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="auto" checked={autoSync} onCheckedChange={(checked) => setAutoSync(!!checked)} />
            <Label htmlFor="auto" className="text-sm font-normal cursor-pointer">
              Auto-sync on save
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={syncToGitHub} disabled={syncing} className="flex-1">
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  {syncConfig?.connected ? "Update Sync" : "Sync to GitHub"}
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
