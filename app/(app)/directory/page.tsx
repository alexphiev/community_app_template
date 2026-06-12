import { searchUsers } from "@/lib/actions/directory"
import { DirectoryClient } from "@/components/directory/DirectoryClient"

export const revalidate = 300

export default async function DirectoryPage() {
  const users = await searchUsers({ page: 1 })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline-h2 text-headline-h2 text-on-surface mb-1">
          Annuaire du Réseau
        </h1>
        <p className="text-[18px] text-on-surface-variant">
          Trouvez et connectez-vous avec les professionnels du réseau Info Jeunes.
        </p>
      </div>

      <DirectoryClient users={users} />
    </div>
  )
}
