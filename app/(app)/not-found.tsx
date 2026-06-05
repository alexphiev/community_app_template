import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <span className="material-symbols-outlined text-[64px] text-on-surface-variant">search_off</span>
      <div>
        <h1
          className="text-[24px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Page introuvable
        </h1>
        <p className="text-[14px] text-on-surface-variant max-w-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="h-10 px-6 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors flex items-center"
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}
