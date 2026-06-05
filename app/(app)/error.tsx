"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <span className="material-symbols-outlined text-[64px] text-coral-700">error</span>
      <div>
        <h1
          className="text-[24px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[14px] text-on-surface-variant max-w-sm">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
      </div>
      <button
        onClick={reset}
        className="h-10 px-6 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}
