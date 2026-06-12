"use client"

import { useState } from "react"
import { createComment } from "@/lib/actions/resources"

type Comment = {
  id: string
  body: string
  parentId: string | null
  createdAt: Date
  author: { id: string; name: string }
}

type CurrentUser = { id: string; name: string }

function CommentItem({
  comment,
  resourceId,
  replies,
  currentUser,
  onReplyAdded,
}: {
  comment: Comment
  resourceId: string
  replies: Comment[]
  currentUser: CurrentUser
  onReplyAdded: (reply: Comment) => void
}) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState("")

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = replyText.trim()
    if (!trimmed) return
    setReplyText("")
    setReplying(false)
    const result = await createComment({ resourceId, parentId: comment.id, body: trimmed })
    onReplyAdded({
      id: result.id,
      body: trimmed,
      parentId: comment.id,
      createdAt: new Date(),
      author: currentUser,
    })
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[12px] font-semibold text-teal-700 flex-shrink-0">
        {comment.author.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-semibold text-on-surface">{comment.author.name}</span>
          <span className="text-[11px] text-[#6e7978]">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
              new Date(comment.createdAt)
            )}
          </span>
        </div>
        <p className="text-[14px] text-on-surface-variant leading-[1.5]">{comment.body}</p>
        <button
          type="button"
          className="mt-1 text-[12px] text-teal-700 hover:underline"
          onClick={() => setReplying((r) => !r)}
          aria-label={`Répondre à ${comment.author.name}`}
        >
          Répondre
        </button>

        {replying && (
          <form onSubmit={submitReply} className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 rounded-lg border border-outline-variant p-2 text-[14px] resize-none min-h-[60px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
              placeholder="Votre réponse..."
              aria-label="Répondre"
            />
            <button
              type="submit"
              className="self-end px-3 py-2 bg-teal-700 text-white rounded-lg text-[14px] font-medium hover:bg-teal-800 transition-colors"
            >
              Envoyer
            </button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-outline-variant space-y-3">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} resourceId={resourceId} replies={[]} currentUser={currentUser} onReplyAdded={onReplyAdded} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentThread({
  resourceId,
  comments: initialComments,
  currentUser,
}: {
  resourceId: string
  comments: Comment[]
  currentUser: CurrentUser
}) {
  const [allComments, setAllComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")

  const topLevel = allComments.filter((c) => !c.parentId)
  const replyMap: Record<string, Comment[]> = {}
  for (const c of allComments) {
    if (c.parentId) {
      replyMap[c.parentId] = [...(replyMap[c.parentId] ?? []), c]
    }
  }

  function handleCommentAdded(comment: Comment) {
    setAllComments((prev) => [...prev, comment])
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newComment.trim()
    if (!trimmed) return
    setNewComment("")
    const result = await createComment({ resourceId, body: trimmed })
    handleCommentAdded({
      id: result.id,
      body: trimmed,
      parentId: null,
      createdAt: new Date(),
      author: currentUser,
    })
  }

  return (
    <section aria-label="Commentaires et questions">
      <h2
        className="text-[24px] font-semibold text-on-surface mb-6"
        style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
      >
        Questions & Réponses ({topLevel.length})
      </h2>

      <form onSubmit={submitComment} className="mb-8 flex gap-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 rounded-lg border border-outline-variant p-3 text-[14px] resize-none min-h-[80px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
          placeholder="Posez votre question ou partagez un commentaire..."
          aria-label="Nouveau commentaire"
        />
        <button
          type="submit"
          className="self-end px-4 py-2 bg-teal-700 text-white rounded-lg text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Publier
        </button>
      </form>

      <div className="space-y-6">
        {topLevel.length === 0 ? (
          <p className="text-[14px] text-[#6e7978] text-center py-8">
            Aucun commentaire pour le moment. Soyez le premier !
          </p>
        ) : (
          topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              resourceId={resourceId}
              replies={replyMap[comment.id] ?? []}
              currentUser={currentUser}
              onReplyAdded={handleCommentAdded}
            />
          ))
        )}
      </div>
    </section>
  )
}
