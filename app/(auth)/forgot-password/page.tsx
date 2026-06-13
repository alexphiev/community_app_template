import { forgotPassword } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ sent?: string }> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Mot de passe oublié</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-[48px] text-teal-700 mb-4 block">mark_email_read</span>
            <p className="text-[14px] text-[#3e4948]">
              Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-[#3e4948] mb-6">
              Entrez votre email pour recevoir un lien de réinitialisation valable <strong>1 heure</strong>.
            </p>
            <form
              className="flex flex-col gap-5"
              action={async (formData: FormData) => {
                "use server"
                await forgotPassword(formData)
                redirect("/forgot-password?sent=1")
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[14px] font-medium text-[#181d1c]">Email</label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
                  placeholder="prenom.nom@structure.fr"
                />
              </div>
              <button type="submit"
                className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all">
                Envoyer le lien
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-[13px]">
          <a href="/login" className="text-teal-700 hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  )
}
