import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id!),
    columns: { name: true, email: true, phone: true, structure: true, role: true },
  })
  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#181d1c]">Mon profil</h1>
        <p className="text-[14px] text-[#6e7978]">Gérez vos informations personnelles et votre mot de passe</p>
      </div>

      {/* Avatar — disabled, future sprint */}
      <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6 mb-4 opacity-50">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#ebefed] flex items-center justify-center text-[22px] font-bold text-teal-700 flex-shrink-0">
            {(user.name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#181d1c] mb-1">Photo de profil</p>
            <p className="text-[12px] text-[#6e7978] mb-3">JPG, PNG ou WebP · max 2 Mo</p>
            <div className="flex gap-2">
              <button disabled className="h-8 px-4 rounded-[6px] bg-[#d2d8d8] text-[#9ea8a7] text-[12px] cursor-not-allowed">Changer</button>
              <button disabled className="h-8 px-4 rounded-[6px] border border-[#d2d8d8] text-[#9ea8a7] text-[12px] cursor-not-allowed">Supprimer</button>
            </div>
          </div>
          <span className="ml-auto text-[11px] text-[#9ea8a7] italic">À venir</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email ?? ""}
          phone={user.phone}
          structure={user.structure}
          role={user.role}
        />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
