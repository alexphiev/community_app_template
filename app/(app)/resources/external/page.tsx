import { auth } from "@/auth"
import { canModerate } from "@/lib/roles"
import { redirect } from "next/navigation"
import { createShareLink } from "@/lib/actions/resources"

export default async function ExternalSharePage() {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) redirect("/resources/documentation")

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Créer un lien de partage
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Partagez un document de façon sécurisée avec une personne extérieure au réseau.
        </p>
      </div>

      <form
        className="space-y-5 bg-white rounded-xl border border-outline-variant p-6 shadow-sm"
        action={async (formData: FormData) => {
          "use server"
          const resourceId = formData.get("resourceId") as string
          const rawPassword = formData.get("password") as string
          const rawDays = formData.get("expiresInDays") as string
          const { token } = await createShareLink({
            resourceId,
            password: rawPassword || undefined,
            expiresInDays: rawDays ? parseInt(rawDays, 10) : undefined,
          })
          redirect(`/share/${token}`)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resourceId" className="text-[14px] font-medium text-on-surface">
            ID de la ressource <span aria-hidden="true">*</span>
          </label>
          <input
            id="resourceId"
            name="resourceId"
            required
            className="h-10 rounded-[6px] border border-input px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white"
            placeholder="resource-id"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sharePassword" className="text-[14px] font-medium text-on-surface">
            Mot de passe (optionnel)
          </label>
          <input
            id="sharePassword"
            name="password"
            type="password"
            className="h-10 rounded-[6px] border border-input px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white"
            placeholder="Laisser vide = pas de protection"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expiresInDays" className="text-[14px] font-medium text-on-surface">
            Expire dans (jours, optionnel)
          </label>
          <input
            id="expiresInDays"
            name="expiresInDays"
            type="number"
            min={1}
            max={365}
            className="h-10 rounded-[6px] border border-input px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white"
            placeholder="30"
          />
        </div>

        <button
          type="submit"
          className="w-full h-10 bg-teal-700 text-white rounded-[6px] text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Générer le lien
        </button>
      </form>
    </div>
  )
}
