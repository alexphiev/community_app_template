import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300

export default async function ToolboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "toolbox", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Boîte à Outils
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Gérez et accédez à vos ressources pédagogiques.
        </p>
      </div>

      <div className="flex gap-6">
        <ResourceFilter
          tags={allTags}
          selectedTagIds={[]}
          selectedTypes={[]}
          onTagToggle={() => {}}
          onTypeToggle={() => {}}
        />
        <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
      </div>
    </div>
  )
}
