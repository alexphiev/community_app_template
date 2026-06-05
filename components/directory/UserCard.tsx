import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, { label: string; variant: "teal" | "coral" }> = {
  admin_ij_pdl:   { label: "Admin IJ PDL",  variant: "teal" },
  salarie_ij_pdl: { label: "Salarié IJ",    variant: "teal" },
  pro_reseau_ij:  { label: "Pro Réseau",    variant: "coral" },
  relais_externe: { label: "Relais",         variant: "coral" },
  guest:          { label: "Invité",         variant: "coral" },
}

type UserCardUser = {
  id: string
  name: string | null
  email: string
  role: string
  structure: string | null
  phone: string | null
  image: string | null
}

export function UserCard({ user }: { user: UserCardUser }) {
  const displayName = user.name ?? user.email
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, variant: "teal" as const }

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center relative overflow-hidden">
      {/* Coral accent hover line */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-coral-700 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-200" aria-hidden="true" />

      {/* Avatar */}
      <div className="relative mb-4">
        {user.image ? (
          <img
            src={user.image}
            alt={displayName}
            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-teal-700/10 border-4 border-white shadow-sm flex items-center justify-center text-[24px] font-semibold text-teal-700 group-hover:scale-105 transition-transform duration-300">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <h3
        className="font-headline-h3 text-headline-h3 text-on-surface mb-1"
      >
        {displayName}
      </h3>

      {user.structure && (
        <p className="text-[14px] font-medium text-teal-700 mb-3">{user.structure}</p>
      )}

      <div className="mb-6">
        <span
          className={cn(
            "inline-block px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-widest border",
            roleInfo.variant === "teal"
              ? "bg-teal-50 text-teal-700 border-teal-100"
              : "bg-coral-50 text-coral-700 border-coral-100"
          )}
        >
          {roleInfo.label}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto w-full space-y-3">
        <a
          href={`mailto:${user.email}`}
          className="w-full py-3 px-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-all flex items-center justify-center gap-2 shadow-sm text-[14px]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">send</span>
          Envoyer un message
        </a>
        {user.phone && (
          <a
            href={`tel:${user.phone}`}
            className="w-full py-2 px-4 text-on-surface-variant font-medium text-[14px] hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">call</span>
            {user.phone}
          </a>
        )}
      </div>
    </div>
  )
}
