import { resetPassword } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { passwordResetTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/forgot-password")

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  })

  if (!row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
          <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Lien invalide ou expiré
          </h1>
          <p className="text-[14px] text-[#3e4948] mb-6">Ce lien a expiré (1h) ou a déjà été utilisé.</p>
          <a href="/forgot-password" className="text-teal-700 text-[14px] hover:underline">Faire une nouvelle demande</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Nouveau mot de passe</p>
        </div>

        <form
          className="flex flex-col gap-5"
          action={async (formData: FormData) => {
            "use server"
            const result = await resetPassword(formData)
            if (result?.error) redirect(`/reset-password?token=${token}&error=1`)
          }}
        >
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">Nouveau mot de passe</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="8 caractères minimum" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#181d1c]">Confirmer le mot de passe</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••" />
          </div>
          <button type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all">
            Enregistrer le mot de passe
          </button>
        </form>

        <p className="mt-6 text-center text-[13px]">
          <a href="/login" className="text-teal-700 hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  )
}
