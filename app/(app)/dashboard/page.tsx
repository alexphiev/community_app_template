import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  return (
    <section>
      <h2
        className="text-[49px] font-extrabold leading-[1.1] tracking-[-0.02em] text-teal-900 mb-2"
        style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
      >
        Bonjour {session?.user.name?.split(" ")[0]}.
      </h2>
      <p className="text-[18px] text-on-surface-variant leading-[1.55]">
        Voici ce qu&apos;il se passe sur votre réseau Info Jeunes aujourd&apos;hui.
      </p>
    </section>
  )
}
