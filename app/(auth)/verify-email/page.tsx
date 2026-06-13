import { verifyEmail } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/login")

  const result = await verifyEmail(token)

  if (result?.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
          <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Lien invalide ou expiré
          </h1>
          <p className="text-[14px] text-[#3e4948] mb-6">{result.error}</p>
          <a href="/register" className="text-teal-700 text-[14px] hover:underline">Créer un nouveau compte</a>
        </div>
      </div>
    )
  }

  redirect("/login?verified=1")
}
