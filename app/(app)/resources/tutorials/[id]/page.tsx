import { notFound } from "next/navigation"
import { getResourceById } from "@/lib/actions/resources"
import { TagPill } from "@/components/resources/TagPill"

export const revalidate = 3600

export default async function TutorialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource || resource.type !== "tutorial") notFound()

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

      {resource.body && (
        <div
          className="prose prose-neutral max-w-none text-[16px] leading-[1.6]"
          // body is authored by Admin/Salarié only — trusted content
          dangerouslySetInnerHTML={{ __html: resource.body }}
        />
      )}
    </article>
  )
}
