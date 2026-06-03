import { searchUsers } from "@/lib/actions/directory"
import { UserCard } from "@/components/directory/UserCard"
import { ROLES } from "@/lib/roles"

export const revalidate = 300

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: ROLES.ADMIN,      label: "Admin IJ PDL" },
  { value: ROLES.SALARIE,    label: "Salarié IJ" },
  { value: ROLES.PRO_RESEAU, label: "Pro Réseau" },
  { value: ROLES.RELAIS,     label: "Relais Externe" },
]

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; role?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  const userList = await searchUsers({
    query: params.query,
    role: params.role as Parameters<typeof searchUsers>[0]["role"],
    page,
  })

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-on-surface mb-1"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Annuaire du Réseau
        </h1>
        <p className="text-[18px] text-on-surface-variant">
          Trouvez et connectez-vous avec les professionnels du réseau Info Jeunes.
        </p>
      </div>

      {/* Filter bar */}
      <form className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[12px] font-semibold text-teal-700 mb-2 uppercase tracking-wider" htmlFor="query">
            Recherche libre
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" aria-hidden="true">
              person_search
            </span>
            <input
              id="query"
              name="query"
              type="search"
              defaultValue={params.query}
              className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all"
              placeholder="Nom, prénom, structure..."
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-[12px] font-semibold text-teal-700 mb-2 uppercase tracking-wider" htmlFor="role">
            Rôle
          </label>
          <select
            id="role"
            name="role"
            defaultValue={params.role ?? ""}
            className="w-full py-3 px-4 bg-white border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-[52px] px-6 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-all flex items-center gap-2 shadow-sm text-[14px] self-end"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">filter_list</span>
          Filtrer
        </button>
      </form>

      {/* Results */}
      {userList.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block" aria-hidden="true">person_search</span>
          <p className="text-[16px]">Aucun professionnel trouvé pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userList.map((user) => (
            <UserCard key={user.id} user={{ ...user, email: user.email ?? "" }} />
          ))}
        </div>
      )}
    </div>
  )
}
