"use client"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-coral-700 mb-4 block">error</span>
        <h1
          className="text-[20px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          {error.message || "Veuillez réessayer ou contacter votre administrateur."}
        </p>
        <button
          onClick={reset}
          className="h-10 w-full rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Réessayer
        </button>
        <a href="/login" className="block mt-4 text-[13px] text-teal-700 hover:underline">
          Retour à la connexion
        </a>
      </div>
    </div>
  )
}
