import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "documentation", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Documentation officielle
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Guides, chartes et documents de référence du réseau IJ.
        </p>
      </div>

      <div className="flex gap-6">
        <ResourceFilter tags={allTags} />
        <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
      </div>

      <a
        href="/resources/documentation/new"
        className="fixed bottom-8 right-8 w-14 h-14 bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
        aria-label="Ajouter une ressource"
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
      </a>
    </div>
  )
}
