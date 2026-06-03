import { getResources } from "@/lib/actions/resources"
import { ResourceGrid } from "@/components/resources/ResourceGrid"

export const revalidate = 3600

export default async function TutorialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))

  const resourceList = await getResources({ type: "tutorial", page })

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Tutoriels
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Guides d'utilisation de la plateforme Hub Pro.
        </p>
      </div>

      <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
    </div>
  )
}
