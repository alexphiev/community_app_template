import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; verified?: string }>
}) {
  const { error, reset, verified } = await searchParams

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
          <p className="text-[14px] text-[#3e4948]">
            Réseau Info Jeunes Pays de la Loire
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-[6px] bg-red-50 border border-red-200 px-3 py-2 text-[14px] text-red-700">
            Identifiants incorrects. Vérifiez votre email et mot de passe.
          </p>
        )}
        {reset && (
          <p className="mb-4 rounded-[6px] bg-green-50 border border-green-200 px-3 py-2 text-[14px] text-green-700">
            Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
          </p>
        )}
        {verified && (
          <p className="mb-4 rounded-[6px] bg-green-50 border border-green-200 px-3 py-2 text-[14px] text-green-700">
            Email confirmé ! Connectez-vous pour accéder à votre compte.
          </p>
        )}

        <form
          className="flex flex-col gap-5"
          action={async (formData: FormData) => {
            "use server"
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/dashboard",
              })
            } catch (err) {
              if (err instanceof AuthError) {
                redirect("/login?error=1")
              }
              throw err
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[14px] font-medium text-[#181d1c]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="prenom.nom@structure.fr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
                Mot de passe
              </label>
              <a href="/forgot-password" className="text-[12px] text-teal-700 hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#e5eaea] text-center">
          <span className="text-[13px] text-[#6e7978]">Pas encore de compte ? </span>
          <a href="/register" className="text-[13px] text-teal-700 font-medium hover:underline">
            Créer un compte
          </a>
        </div>
      </div>
    </div>
  )
}
