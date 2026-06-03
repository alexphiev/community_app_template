import { getPendingContent } from "@/lib/actions/admin"
import { approveResource, deleteResource } from "@/lib/actions/resources"

export default async function AdminModerationPage() {
  const pendingList = await getPendingContent()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-semibold text-on-surface" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          File de modération
        </h2>
        {pendingList.length > 0 && (
          <span className="bg-coral-100 text-coral-700 text-[12px] font-bold px-3 py-1 rounded-full">
            {pendingList.length} en attente
          </span>
        )}
      </div>

      {pendingList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block" aria-hidden="true">check_circle</span>
          <p className="text-[16px] text-on-surface-variant">Tout est à jour — aucun contenu en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingList.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    {resource.type}
                  </span>
                  <span className="text-[11px] text-outline">par {resource.author?.name ?? "?"}</span>
                </div>
                <h3 className="text-[16px] font-semibold text-on-surface">{resource.title}</h3>
                {resource.description && (
                  <p className="text-[14px] text-on-surface-variant mt-1 line-clamp-2">{resource.description}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <form action={async () => {
                  "use server"
                  await approveResource(resource.id)
                }}>
                  <button type="submit" className="px-4 py-2 bg-teal-700 text-white text-[14px] font-medium rounded-lg hover:bg-teal-800 transition-colors">
                    Approuver
                  </button>
                </form>
                <form action={async () => {
                  "use server"
                  await deleteResource(resource.id)
                }}>
                  <button type="submit" className="px-4 py-2 border border-red-300 text-red-600 text-[14px] font-medium rounded-lg hover:bg-red-50 transition-colors">
                    Rejeter
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
