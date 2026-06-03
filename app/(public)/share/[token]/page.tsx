import { notFound } from "next/navigation"
import { verifyShareLink } from "@/lib/actions/resources"

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ password?: string }>
}) {
  const { token } = await params
  const { password } = await searchParams

  const result = await verifyShareLink(token, password)

  if (result === null) notFound()

  if (result === "password_required" || result === "invalid_password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-outline-variant shadow-sm p-8">
          <h1
            className="text-[24px] font-semibold text-teal-700 mb-2"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Document protégé
          </h1>
          {result === "invalid_password" && (
            <p className="text-[14px] text-red-600 mb-4" role="alert">
              Mot de passe incorrect.
            </p>
          )}
          <form method="GET">
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="password" className="text-[14px] font-medium text-on-surface">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="h-10 rounded-[6px] border border-input px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 bg-teal-700 text-white rounded-[6px] text-[14px] font-medium hover:bg-teal-800"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    )
  }

  const resource = result

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-lg bg-white rounded-[14px] border border-outline-variant shadow-sm p-8">
        <p className="text-[12px] text-outline mb-2 uppercase tracking-wide">
          Document partagé
        </p>
        <h1
          className="text-[31px] font-semibold text-on-surface mb-4"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-[14px] text-on-surface-variant mb-6">{resource.description}</p>
        )}
        {resource.files && resource.files.length > 0 && (
          <div className="border border-outline-variant rounded-xl overflow-hidden flex items-center">
            <div className="bg-teal-700 p-4 text-white">
              <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                picture_as_pdf
              </span>
            </div>
            <div className="p-4 flex-1">
              <p className="text-[14px] font-semibold text-on-surface">
                {resource.files[0].filename}
              </p>
              <p className="text-[12px] text-outline">
                {(resource.files[0].sizeBytes / 1_048_576).toFixed(1)} MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
