import { getEvents } from "@/lib/actions/news"
import { CalendarGrid } from "@/components/news/CalendarGrid"

export const revalidate = 300

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

const CATEGORY_COLORS: Record<string, string> = {
  formation: "bg-blue-500",
  reunion:   "bg-green-500",
  evenement: "bg-purple-500",
  autre:     "bg-outline-variant",
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()), 10)
  const month = Math.max(0, Math.min(11, parseInt(params.month ?? String(now.getMonth()), 10)))

  const allEvents = await getEvents({})
  const monthEvents = allEvents.filter((e) => {
    const d = new Date(e.startAt)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear  = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear  = month === 11 ? year + 1 : year

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1
            className="text-[31px] font-semibold leading-[1.25] text-on-surface mb-1"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Agenda Hub Pro
          </h1>
          <p className="text-on-surface-variant text-[14px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">today</span>
            {MONTH_NAMES[month]} {year}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1" aria-label="Navigation mensuelle">
            <a
              href={`?year=${prevYear}&month=${prevMonth}`}
              className="p-2 rounded-lg hover:bg-surface-container transition-colors"
              aria-label="Mois précédent"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
            </a>
            <span className="px-3 text-[14px] font-medium text-on-surface min-w-[120px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <a
              href={`?year=${nextYear}&month=${nextMonth}`}
              className="p-2 rounded-lg hover:bg-surface-container transition-colors"
              aria-label="Mois suivant"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
            </a>
          </nav>

          <a
            href="/api/events/ical"
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-[14px] text-on-surface-variant hover:bg-surface-container transition-colors"
            download="hub-pro-agenda.ics"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">calendar_month</span>
            Exporter .ics
          </a>
        </div>
      </div>

      <CalendarGrid events={monthEvents} year={year} month={month} />

      <div className="mt-6 flex flex-wrap gap-4">
        {Object.entries({ formation: "Formation", reunion: "Réunion", evenement: "Événement", autre: "Autre" }).map(
          ([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[key]}`} aria-hidden="true" />
              <span className="text-[12px] text-on-surface-variant">{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
