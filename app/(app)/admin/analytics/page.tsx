import { getAnalytics } from "@/lib/actions/admin"

type StatCardProps = { label: string; value: number; icon: string; color: string }

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">{icon}</span>
        </div>
      </div>
      <p className="text-[39px] font-bold leading-[1.15] text-on-surface" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="text-[14px] text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const stats = await getAnalytics()

  return (
    <div>
      <h2 className="text-[24px] font-semibold text-on-surface mb-6" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
        Tableau de bord analytique
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="Utilisateurs actifs"
          value={stats.totalUsers}
          icon="group"
          color="bg-teal-50 text-teal-700"
        />
        <StatCard
          label="Ressources publiées"
          value={stats.publishedResources}
          icon="folder_open"
          color="bg-teal-50 text-teal-700"
        />
        <StatCard
          label="Posts publiés"
          value={stats.publishedPosts}
          icon="campaign"
          color="bg-coral-50 text-coral-700"
        />
      </div>

      <div className="mt-8 bg-white rounded-xl border border-outline-variant shadow-sm p-6">
        <p className="text-[14px] text-on-surface-variant text-center py-8">
          <span className="material-symbols-outlined text-[32px] text-outline block mb-2" aria-hidden="true">bar_chart</span>
          Les graphiques détaillés (taux d&apos;adoption, ressources les plus consultées) seront ajoutés lors de la prochaine itération.
        </p>
      </div>
    </div>
  )
}
