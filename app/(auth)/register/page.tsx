import { getInviteByToken, acceptInvite } from "@/lib/actions/invites"

async function acceptInviteAction(formData: FormData) {
  "use server"
  await acceptInvite(formData)
}

type Props = { searchParams: Promise<{ token?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidLink />
  }

  const invite = await getInviteByToken(token)
  const isValid = invite && !invite.usedAt && invite.expiresAt > new Date()

  if (!isValid) {
    return <InvalidLink />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1
            className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Créez votre compte</p>
        </div>

        <form className="flex flex-col gap-5" action={acceptInviteAction}>
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[14px] font-medium text-[#181d1c]">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={invite.name ?? ""}
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="Prénom Nom"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="8 caractères minimum"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#181d1c]">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6e7978]">
          <a href="/login" className="text-teal-700 hover:underline">
            Retour à la connexion
          </a>
        </p>
      </div>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-coral-700 mb-4 block">
          link_off
        </span>
        <h1
          className="text-[20px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Lien invalide ou expiré
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Ce lien d&apos;invitation est invalide ou a expiré (72h). Contactez votre administrateur pour recevoir une nouvelle invitation.
        </p>
        <a href="/login" className="text-teal-700 text-[14px] hover:underline">
          Retour à la connexion
        </a>
      </div>
    </div>
  )
}
