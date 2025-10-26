"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Check, Trash2, Reply } from "lucide-react"
import toast from "react-hot-toast"

interface Comment {
  id: string
  content: string
  line_number: number | null
  resolved: boolean
  user_name: string | null
  user_email: string
  user_image: string | null
  created_at: string
  parent_id: string | null
}

export function CommentsPanel({ specId }: { specId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [specId])

  async function fetchComments() {
    try {
      const response = await fetch(`/api/specs/${specId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setLoading(false)
    }
  }

  async function addComment() {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/specs/${specId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          lineNumber: selectedLine,
          parentId: replyTo,
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([...comments, comment])
        setNewComment("")
        setSelectedLine(null)
        setReplyTo(null)
        toast.success("Comment added")
      } else {
        toast.error("Failed to add comment")
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast.error("Failed to add comment")
    }
  }

  async function resolveComment(commentId: string) {
    try {
      const response = await fetch(`/api/specs/${specId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      })

      if (response.ok) {
        setComments(comments.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)))
        toast.success("Comment resolved")
      }
    } catch (error) {
      console.error("Failed to resolve comment:", error)
      toast.error("Failed to resolve comment")
    }
  }

  async function deleteComment(commentId: string) {
    try {
      const response = await fetch(`/api/specs/${specId}/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
        toast.success("Comment deleted")
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const topLevelComments = comments.filter((c) => !c.parent_id)
  const getReplies = (commentId: string) => comments.filter((c) => c.parent_id === commentId)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className={`p-3 rounded-lg border ${comment.resolved ? "bg-muted/50" : "bg-background"}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user_image || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.user_name?.[0] || comment.user_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.user_name || comment.user_email}</span>
                      {comment.line_number && (
                        <Badge variant="outline" className="text-xs">
                          Line {comment.line_number}
                        </Badge>
                      )}
                      {comment.resolved && (
                        <Badge variant="secondary" className="text-xs">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyTo(comment.id)}>
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      {!comment.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => resolveComment(comment.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply.user_image || undefined} />
                      <AvatarFallback className="text-xs">
                        {reply.user_name?.[0] || reply.user_email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{reply.user_name || reply.user_email}</span>
                      <p className="text-xs text-muted-foreground mt-1">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Replying to comment</span>
            <Button variant="ghost" size="sm" className="h-6" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
          </div>
        )}
        {selectedLine && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Comment on line {selectedLine}</span>
            <Button variant="ghost" size="sm" className="h-6" onClick={() => setSelectedLine(null)}>
              Clear
            </Button>
          </div>
        )}
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] text-sm"
        />
        <Button onClick={addComment} size="sm" className="w-full">
          Add Comment
        </Button>
      </div>
    </div>
  )
}
