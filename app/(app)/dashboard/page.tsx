import { auth } from "@/auth"
import { getPosts, getEvents } from "@/lib/actions/news"
import { getResources } from "@/lib/actions/resources"
import Link from "next/link"

export const revalidate = 60

const QUICK_LINKS = [
  { icon: "add_circle",          label: "Créer un post",       sub: "Partagez une info au réseau",          href: "/news",                  iconColor: "text-teal-700" },
  { icon: "home_repair_service", label: "Boîte à Outils",      sub: "Accédez à vos ressources pédagogiques", href: "/resources/toolbox",    iconColor: "text-teal-700" },
  { icon: "calendar_month",      label: "Agenda",               sub: "Voir les événements à venir",          href: "/agenda",               iconColor: "text-teal-700" },
  { icon: "contact_phone",       label: "Annuaire",             sub: "Trouver un collègue du réseau",        href: "/directory",            iconColor: "text-coral-700" },
]

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user.name?.split(" ")[0] ?? "vous"

  const [recentPosts, upcomingEvents, pinnedResources] = await Promise.all([
    getPosts({ page: 1 }),
    getEvents({}),
    getResources({ type: "documentation", page: 1 }),
  ])

  const nextEvents = upcomingEvents
    .filter((e) => new Date(e.startAt) >= new Date())
    .slice(0, 3)

  const recentFeedPosts = recentPosts.slice(0, 3)
  const featuredResources = pinnedResources.filter((r) => r.pinned).slice(0, 4)

  const CATEGORY_BG: Record<string, string> = {
    formation: "bg-teal-700",
    reunion:   "bg-coral-700",
    evenement: "bg-teal-700",
    autre:     "bg-surface-container",
  }

  return (
    <div>
      {/* Hero greeting */}
      <section className="mb-10">
        <h1
          className="font-hero-title text-hero-title text-teal-900 mb-2"
        >
          Bonjour {firstName}.
        </h1>
        <p className="text-[18px] text-on-surface-variant leading-[1.55]">
          Voici ce qu&apos;il se passe sur votre réseau Info Jeunes aujourd&apos;hui.
        </p>
      </section>

      {/* Quick access cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10" aria-label="Accès rapide">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col p-6 bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md text-left transition-all hover:-translate-y-1"
          >
            <span className={`material-symbols-outlined mb-4 text-[32px] ${item.iconColor}`} aria-hidden="true">
              {item.icon}
            </span>
            <span className="font-bold text-[16px] text-on-surface">{item.label}</span>
            <span className="text-[12px] text-on-surface-variant mt-1">{item.sub}</span>
          </Link>
        ))}
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left — activity feed (7/12) */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          {/* Recent news */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-[20px]" aria-hidden="true">campaign</span>
                <h2 className="text-[16px] font-bold text-on-surface">Actualités récentes</h2>
              </div>
              <Link href="/news" className="text-teal-700 text-[12px] font-semibold hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-outline-variant">
              {recentFeedPosts.length === 0 ? (
                <p className="p-6 text-[14px] text-on-surface-variant text-center">Aucune actualité.</p>
              ) : (
                recentFeedPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-surface-container-low transition-colors cursor-pointer relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-coral-700 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-200" aria-hidden="true" />
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-700/10 flex items-center justify-center text-[12px] font-semibold text-teal-700 shrink-0">
                        {(post.author.name ?? post.author.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-on-surface">{post.author.name}</p>
                        <p className="text-[14px] text-on-surface-variant line-clamp-2 mt-1">{post.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pinned resources */}
          {featuredResources.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-700 text-[20px]" aria-hidden="true">push_pin</span>
                  <h2 className="text-[16px] font-bold text-on-surface">Ressources épinglées</h2>
                </div>
                <Link href="/resources/documentation" className="text-teal-700 text-[12px] font-semibold hover:underline">Tout voir</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {featuredResources.map((r) => (
                  <Link
                    key={r.id}
                    href={`/resources/${r.type}/${r.id}`}
                    className="shrink-0 w-44 p-4 rounded-lg bg-surface-container-low border border-outline-variant hover:border-teal-700 transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-teal-700 mb-3 block text-[24px]" aria-hidden="true">description</span>
                    <p className="text-[14px] font-bold mb-1 leading-tight group-hover:text-teal-700 transition-colors">{r.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — events (5/12) */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          {/* Upcoming events */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-[20px]" aria-hidden="true">event</span>
                <h2 className="text-[16px] font-bold text-on-surface">Agenda à venir</h2>
              </div>
              <Link href="/agenda" className="text-teal-700 text-[12px] font-semibold hover:underline">Calendrier</Link>
            </div>
            <div className="space-y-4">
              {nextEvents.length === 0 ? (
                <p className="text-[14px] text-on-surface-variant text-center py-4">Aucun événement à venir.</p>
              ) : (
                nextEvents.map((event) => {
                  const d = new Date(event.startAt)
                  const catBg = CATEGORY_BG[event.category] ?? "bg-teal-700"
                  return (
                    <Link
                      key={event.id}
                      href="/agenda"
                      className="flex gap-4 items-start p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-12 h-14 bg-surface border border-outline-variant rounded flex flex-col overflow-hidden text-center shrink-0">
                        <span className={`${catBg} text-white text-[11px] py-0.5 font-bold uppercase`}>
                          {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d)}
                        </span>
                        <span className="text-[24px] font-bold text-on-surface flex-1 flex items-center justify-center">
                          {d.getDate()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-[14px] text-on-surface">{event.title}</h3>
                        <p className="text-[12px] text-on-surface-variant flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                          {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d)}
                        </p>
                        {event.location && (
                          <p className="text-[12px] text-teal-700 font-medium mt-1">{event.location}</p>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coral FAB */}
      <Link
        href="/news"
        className="fixed bottom-8 right-8 w-14 h-14 bg-coral-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-50"
        aria-label="Créer un post"
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
      </Link>
    </div>
  )
}
