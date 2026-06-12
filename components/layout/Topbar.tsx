import { auth, signOut } from "@/auth"

export async function Topbar() {
  const session = await auth()
  if (!session) return null

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const roleLabel: Record<string, string> = {
    admin_ij_pdl: "Admin IJ PDL",
    salarie_ij_pdl: "Salarié IJ",
    pro_reseau_ij: "Pro Réseau",
    relais_externe: "Relais",
    guest: "Invité",
  }

  return (
    <header className="h-16 flex justify-between items-center px-8 bg-[#f6faf9] border-b border-[#bdc9c7] sticky top-0 z-40">
      <div className="flex items-center w-1/2" title="Fonctionnalité à venir">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978]/40 text-[20px]" aria-hidden="true">
            search
          </span>
          <input
            className="w-full bg-[#f0f4f3] border-none rounded-full pl-10 pr-4 py-2 text-[14px] opacity-40 cursor-not-allowed"
            placeholder="Rechercher une ressource, un collègue..."
            type="search"
            aria-label="Rechercher"
            disabled
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative p-2 rounded-full opacity-40 cursor-not-allowed"
          aria-label="Notifications"
          disabled
          title="Fonctionnalité à venir"
        >
          <span className="material-symbols-outlined text-[#3e4948] text-[20px]" aria-hidden="true">
            notifications
          </span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-coral-700 rounded-full" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[#bdc9c7]">
          <div className="text-right">
            <p className="font-medium text-[14px]">{session.user.name}</p>
            <p className="text-[#3e4948] text-[12px]">{roleLabel[session.user.role] ?? session.user.role}</p>
          </div>
          <form>
            <button
              formAction={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
              className="w-10 h-10 rounded-full bg-[#ebefed] flex items-center justify-center text-[14px] font-semibold text-teal-700 hover:bg-[#e5e9e7] transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              {initials}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
