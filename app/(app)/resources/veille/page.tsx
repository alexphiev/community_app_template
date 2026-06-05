import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300

export default async function VeillePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "veille", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Veille partagée
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Articles, rapports et liens sélectionnés par le réseau.
        </p>
      </div>

      <div className="flex gap-6">
        <ResourceFilter tags={allTags} />
        <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
      </div>
    </div>
  )
}
