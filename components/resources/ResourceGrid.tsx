import { cn } from "@/lib/utils"
import { ResourceCard } from "./ResourceCard"

type Resource = Parameters<typeof ResourceCard>[0]["resource"]

interface ResourceGridProps {
  resources: Resource[]
  total: number
  page: number
  pageSize?: number
}

export function ResourceGrid({ resources, total, page, pageSize = 12 }: ResourceGridProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <section className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[14px] text-[#6e7978]">
          <span className="font-bold text-[#181d1c]">{total}</span>{" "}
          ressource{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
        </p>
      </div>

      {resources.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          role="status"
          aria-label="Aucune ressource trouvée"
        >
          <span
            className="material-symbols-outlined text-[48px] text-[#bdc9c7] mb-4"
            aria-hidden="true"
          >
            folder_open
          </span>
          <h3
            className="text-[24px] font-semibold text-[#181d1c] mb-2"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Aucune ressource trouvée
          </h3>
          <p className="text-[14px] text-[#3e4948]">
            Essayez de modifier vos filtres ou d&apos;ajouter de nouveaux documents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
          <a
            href={`?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border border-[#bdc9c7] rounded-lg text-[14px] text-[#3e4948] hover:bg-[#ebefed] transition-colors",
              page <= 1 && "pointer-events-none opacity-50"
            )}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              chevron_left
            </span>
            Précédent
          </a>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-lg text-[14px] font-semibold transition-colors",
                  p === page
                    ? "bg-teal-700 text-white"
                    : "hover:bg-[#ebefed] text-[#3e4948]"
                )}
              >
                {p}
              </a>
            ))}
          </div>

          <a
            href={`?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border border-[#bdc9c7] rounded-lg text-[14px] text-[#3e4948] hover:bg-[#ebefed] transition-colors",
              page >= totalPages && "pointer-events-none opacity-50"
            )}
          >
            Suivant
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              chevron_right
            </span>
          </a>
        </nav>
      )}
    </section>
  )
}
