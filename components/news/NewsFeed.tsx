"use client"

import { useState, useRef } from "react"
import { createPost } from "@/lib/actions/news"
import { PostCard } from "./PostCard"

type Post = {
  id: string
  body: string
  pinned: boolean
  createdAt: Date
  author: { id: string; name: string; role?: string }
  comments: { id: string }[]
  reactions: { postId: string; userId: string; emoji: string }[]
}

type CurrentUser = { id: string; name: string; role: string }

export function NewsFeed({ initialPosts, currentUser }: { initialPosts: Post[]; currentUser: CurrentUser }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [body, setBody] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setBody("")
    const result = await createPost({ body: trimmed })
    const optimistic: Post = {
      id: result.id,
      body: trimmed,
      pinned: false,
      createdAt: new Date(),
      author: currentUser,
      comments: [],
      reactions: [],
    }
    setPosts((prev) => [optimistic, ...prev])
    textareaRef.current?.focus()
  }

  return (
    <>
      <div className="bg-surface p-6 rounded-lg border border-outline-variant shadow-sm">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-[14px] min-h-[100px] resize-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-all"
            placeholder="Partager une actualité ou une information avec le réseau..."
            aria-label="Nouveau post"
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={!body.trim()}
              className="bg-teal-700 text-white px-6 py-2 rounded font-medium text-[14px] hover:bg-teal-800 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publier
            </button>
          </div>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block" aria-hidden="true">feed</span>
          <p className="text-[16px]">Aucune actualité pour le moment.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </>
  )
}
