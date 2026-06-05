import Link from "next/link"
import { cn } from "@/lib/utils"
import { TagPill } from "./TagPill"
import { PendingBadge } from "./PendingBadge"

const MEDIA_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  pdf: { icon: "picture_as_pdf", bg: "bg-red-50", color: "text-red-600" },
  video: { icon: "video_library", bg: "bg-teal-50", color: "text-teal-700" },
  audio: { icon: "headphones", bg: "bg-teal-50", color: "text-teal-700" },
  link: { icon: "link", bg: "bg-[#ffb4a5]/20", color: "text-[#a33d2a]" },
  image: { icon: "image", bg: "bg-teal-50", color: "text-teal-700" },
}

type ResourceCardResource = {
  id: string
  title: string
  description?: string | null
  type: string
  mediaType?: string | null
  status: string
  pinned: boolean
  createdAt: Date
  tags?: { tag: { id: string; name: string; slug: string } }[]
}

export function ResourceCard({
  resource,
  href,
}: {
  resource: ResourceCardResource
  href?: string
}) {
  const media = MEDIA_ICONS[resource.mediaType ?? ""] ?? MEDIA_ICONS.pdf
  const isPinned = resource.pinned
  const isPending = resource.status === "pending_approval"
  const linkHref = href ?? `/resources/${resource.type}/${resource.id}`

  return (
    <article
      className={cn(
        "group bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden",
        isPinned ? "border-teal-700/20" : "border-outline-variant"
      )}
    >
      {isPinned && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-teal-700 text-white text-[11px] font-semibold rounded-bl-lg z-10">
          Mise en avant
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", media.bg)}>
          <span className={cn("material-symbols-outlined", media.color)} aria-hidden="true">
            {media.icon}
          </span>
        </div>
        {isPending && <PendingBadge />}
      </div>

      <Link
        href={linkHref}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded"
      >
        <h3 className="text-[24px] font-semibold leading-[1.35] text-on-surface mb-2 group-hover:text-teal-700 transition-colors">
          {resource.title}
        </h3>
      </Link>

      {resource.description && (
        <p className="text-[14px] text-on-surface-variant leading-[1.5] line-clamp-2 mb-4">
          {resource.description}
        </p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {resource.tags.map(({ tag }) => (
            <TagPill key={tag.id} name={tag.name} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
        <span className="text-[12px] text-outline italic">
          {new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(resource.createdAt))}
        </span>
      </div>

      {isPinned && (
        <div
          className="absolute -bottom-10 -right-6 w-32 h-6 bg-coral-700/5 rotate-[15deg]"
          aria-hidden="true"
        />
      )}
    </article>
  )
}
