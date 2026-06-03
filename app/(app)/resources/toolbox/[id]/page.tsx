import { notFound } from "next/navigation"
import { getResourceById } from "@/lib/actions/resources"
import { CommentThread } from "@/components/resources/CommentThread"
import { TagPill } from "@/components/resources/TagPill"

export const revalidate = 0

const MEDIA_ICONS: Record<string, string> = {
  video: "video_library",
  audio: "headphones",
  pdf:   "picture_as_pdf",
}

export default async function ToolboxItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource || resource.type !== "toolbox") notFound()

  const comments = (resource.comments ?? []) as {
    id: string
    body: string
    parentId: string | null
    createdAt: Date
    author: { id: string; name: string }
  }[]

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {resource.tags.map(({ tag }) => (
              <TagPill key={tag.id} name={tag.name} />
            ))}
          </div>
        )}
        <h1
          className="text-[39px] font-bold leading-[1.15] text-on-surface mb-3"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-[18px] text-on-surface-variant leading-[1.55]">
            {resource.description}
          </p>
        )}
      </header>

      {resource.files && resource.files.length > 0 && (
        <div className="mb-12">
          <div className="border border-outline-variant rounded-xl overflow-hidden bg-white flex items-center hover:border-teal-700/50 transition-colors cursor-pointer">
            <div className="bg-teal-700 p-4 text-white">
              <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                {MEDIA_ICONS[resource.mediaType ?? ""] ?? "picture_as_pdf"}
              </span>
            </div>
            <div className="p-4 flex-1">
              <p className="text-[14px] font-semibold text-on-surface hover:text-teal-700">
                {resource.files[0].filename}
              </p>
              <p className="text-[12px] text-outline">
                {(resource.files[0].sizeBytes / 1_048_576).toFixed(1)} MB
              </p>
            </div>
            <div className="p-4">
              <span className="material-symbols-outlined text-teal-700" aria-hidden="true">
                download
              </span>
            </div>
          </div>
        </div>
      )}

      <CommentThread resourceId={resource.id} comments={comments} />
    </article>
  )
}
