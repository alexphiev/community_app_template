type MessageBubbleMessage = {
  id: string
  body: string
  createdAt: Date
  editedAt: Date | null
  author: { id: string; name: string | null; image: string | null }
}

export function MessageBubble({ message, isAlternate = false }: { message: MessageBubbleMessage; isAlternate?: boolean }) {
  const authorName = message.author.name ?? "Utilisateur"
  const initials = authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className={`px-6 py-4 hover:bg-surface-container-low transition-colors group ${isAlternate ? "bg-surface-container-low/30" : ""}`}>
      <div className="flex gap-4">
        {message.author.image ? (
          <img
            src={message.author.image}
            alt={authorName}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-teal-700/10 flex items-center justify-center text-[12px] font-semibold text-teal-700 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[14px] font-bold text-teal-700">{authorName}</span>
            <span className="text-[11px] text-on-surface-variant opacity-60">
              {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
                new Date(message.createdAt)
              )}
            </span>
            {message.editedAt && (
              <span className="text-[11px] text-outline italic">(modifié)</span>
            )}
          </div>
          <p className="text-[16px] text-on-surface leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>
        </div>
      </div>
    </div>
  )
}
