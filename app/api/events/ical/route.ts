import { NextResponse } from "next/server"
import { getEvents } from "@/lib/actions/news"
import { createEvents } from "ics"

export const dynamic = "force-dynamic"

export async function GET() {
  const events = await getEvents({})

  const icsEvents = events.map((e) => {
    const start = new Date(e.startAt)
    const end = new Date(e.endAt)
    return {
      title: e.title,
      description: e.description ?? undefined,
      location: e.location ?? undefined,
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ] as [number, number, number, number, number],
      end: [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ] as [number, number, number, number, number],
      uid: `${e.id}@hub-pro.info-jeunes-pdl.fr`,
    }
  })

  const { error, value } = createEvents(icsEvents)

  if (error || !value) {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 })
  }

  return new NextResponse(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hub-pro-agenda.ics"',
    },
  })
}
