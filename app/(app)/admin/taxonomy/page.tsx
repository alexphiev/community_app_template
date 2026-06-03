import { getAllTags, createTag, deleteTag } from "@/lib/actions/admin"

export default async function AdminTaxonomyPage() {
  const tagList = await getAllTags()

  return (
    <div>
      <h2 className="text-[24px] font-semibold text-on-surface mb-6" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
        Gestion des tags
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="text-[16px] font-semibold text-on-surface mb-4">Créer un tag</h3>
          <form className="flex gap-3" action={async (fd: FormData) => {
            "use server"
            const name = fd.get("name") as string
            if (name?.trim()) await createTag({ name: name.trim() })
          }}>
            <input
              name="name"
              type="text"
              required
              className="flex-1 h-10 rounded-[6px] border border-input px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white"
              placeholder="Nom du tag (ex: Emploi)"
            />
            <button type="submit" className="px-4 h-10 bg-teal-700 text-white rounded-[6px] text-[14px] font-medium hover:bg-teal-800 transition-colors whitespace-nowrap">
              Créer
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="text-[16px] font-semibold text-on-surface mb-4">Tags existants ({tagList.length})</h3>
          {tagList.length === 0 ? (
            <p className="text-[14px] text-on-surface-variant">Aucun tag pour le moment.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1 bg-teal-50 border border-teal-100 rounded-full pl-3 pr-1 py-1">
                  <span className="text-[12px] font-semibold text-teal-700">{tag.name}</span>
                  <form action={async () => {
                    "use server"
                    await deleteTag(tag.id)
                  }}>
                    <button type="submit" className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-teal-200 transition-colors" aria-label={`Supprimer le tag ${tag.name}`}>
                      <span className="material-symbols-outlined text-[14px] text-teal-700" aria-hidden="true">close</span>
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
