import { getUsers, suspendUser, unsuspendUser } from "@/lib/actions/admin"

const ROLE_LABELS: Record<string, string> = {
  admin_ij_pdl:   "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij:  "Pro Réseau",
  relais_externe: "Relais",
  guest:          "Invité",
}

export default async function AdminUsersPage() {
  const userList = await getUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-semibold text-on-surface" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          Gestion des utilisateurs
        </h2>
        <span className="text-[14px] text-on-surface-variant">{userList.length} utilisateurs</span>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-[14px]" aria-label="Liste des utilisateurs">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] uppercase tracking-wider text-on-surface-variant">
              <th className="text-left px-6 py-3 font-semibold">Nom</th>
              <th className="text-left px-6 py-3 font-semibold">Email</th>
              <th className="text-left px-6 py-3 font-semibold">Rôle</th>
              <th className="text-left px-6 py-3 font-semibold">Structure</th>
              <th className="text-left px-6 py-3 font-semibold">Statut</th>
              <th className="text-right px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {userList.map((user) => (
              <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-medium text-on-surface">{user.name ?? "—"}</td>
                <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-semibold border border-teal-100">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{user.structure ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.suspended ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                    {user.suspended ? "Suspendu" : "Actif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={async () => {
                      "use server"
                      if (user.suspended) await unsuspendUser(user.id)
                      else await suspendUser(user.id)
                    }}>
                      <button
                        type="submit"
                        className={`text-[12px] px-3 py-1 rounded-lg border font-medium transition-colors ${user.suspended ? "border-green-500 text-green-700 hover:bg-green-50" : "border-red-300 text-red-600 hover:bg-red-50"}`}
                      >
                        {user.suspended ? "Réactiver" : "Suspendre"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {userList.length === 0 && (
          <p className="text-center py-12 text-on-surface-variant text-[14px]">Aucun utilisateur.</p>
        )}
      </div>
    </div>
  )
}
