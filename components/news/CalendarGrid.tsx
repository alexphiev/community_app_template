"use client"

const DAYS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."]

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  formation: { bg: "bg-teal-100",   border: "border-teal-700",   text: "text-teal-800" },
  reunion:   { bg: "bg-coral-100",  border: "border-coral-700",  text: "text-coral-800" },
  evenement: { bg: "bg-teal-100",   border: "border-teal-700",   text: "text-teal-800" },
  autre:     { bg: "bg-neutral-100", border: "border-outline",    text: "text-on-surface" },
}

type CalEvent = {
  id: string
  title: string
  startAt: Date
  category: "formation" | "reunion" | "evenement" | "autre"
}

interface CalendarGridProps {
  events: CalEvent[]
  year: number
  month: number // 0-indexed
}

export function CalendarGrid({ events, year, month }: CalendarGridProps) {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  // Monday=0 ... Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsForDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.startAt)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-3 px-2 text-[11px] font-semibold text-on-surface-variant uppercase text-center border-r last:border-r-0 border-outline-variant"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dayEvents = day ? eventsForDay(day) : []
          const todayCell = day !== null && isToday(day)
          const isLastRow = i >= cells.length - 7
          const isLastCol = (i + 1) % 7 === 0

          return (
            <div
              key={i}
              className={[
                "min-h-[100px] p-2",
                !isLastRow && "border-b border-outline-variant",
                !isLastCol && "border-r border-outline-variant",
                day === null && "opacity-30 bg-neutral-50",
                todayCell && "bg-teal-50/20",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {day !== null && (
                <>
                  <span
                    className={[
                      "text-[14px] font-semibold block mb-1",
                      todayCell ? "text-teal-700" : "text-on-surface",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.map((ev) => {
                      const s = CATEGORY_STYLES[ev.category] ?? CATEGORY_STYLES.autre
                      return (
                        <div
                          key={ev.id}
                          className={`p-1 rounded border-l-4 ${s.bg} ${s.border} cursor-pointer hover:shadow-sm transition-shadow`}
                          title={ev.title}
                        >
                          <p className={`text-[11px] font-bold leading-tight ${s.text} truncate`}>
                            {ev.title}
                          </p>
                          <p className={`text-[10px] ${s.text} opacity-80`}>
                            {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
                              new Date(ev.startAt)
                            )}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
