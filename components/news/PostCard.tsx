import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  admin_ij_pdl:   "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij:  "Pro Réseau",
  relais_externe: "Relais",
  guest:          "Invité",
}

type PostCardPost = {
  id: string
  body: string
  pinned: boolean
  createdAt: Date
  author: { id: string; name: string; role?: string }
  comments: { id: string }[]
  reactions: { postId: string; userId: string; emoji: string }[]
}

export function PostCard({ post }: { post: PostCardPost }) {
  const initials = post.author.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  const reactionCount = post.reactions.length
  const commentCount = post.comments.length

  return (
    <article
      className={cn(
        "bg-white rounded-lg border shadow-sm",
        post.pinned ? "border-coral-700/20" : "border-outline-variant"
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-700/10 flex items-center justify-center text-[14px] font-semibold text-teal-700 flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[16px] font-bold text-on-surface">{post.author.name}</p>
              <div className="flex items-center gap-2">
                {post.pinned && (
                  <span className="bg-coral-100 text-coral-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tight">
                    À la une
                  </span>
                )}
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  {ROLE_LABELS[post.author.role ?? ""] ?? post.author.role}
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-[11px] text-outline">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(post.createdAt)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[16px] text-on-surface leading-relaxed whitespace-pre-wrap">{post.body}</p>
      </div>

      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between rounded-b-lg">
        <div className="flex gap-6">
          <button
            className="flex items-center gap-2 text-on-surface-variant hover:text-coral-700 transition-colors font-medium text-sm"
            aria-label={`${reactionCount} réaction${reactionCount !== 1 ? "s" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">favorite</span>
            <span>{reactionCount}</span>
          </button>
          <button
            className="flex items-center gap-2 text-on-surface-variant hover:text-teal-700 transition-colors font-medium text-sm"
            aria-label={`${commentCount} commentaire${commentCount !== 1 ? "s" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat_bubble</span>
            <span>{commentCount}</span>
          </button>
        </div>
        <button className="flex items-center gap-2 text-on-surface-variant hover:text-teal-700 transition-colors font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">bookmark</span>
          <span>Enregistrer</span>
        </button>
      </div>
    </article>
  )
}
