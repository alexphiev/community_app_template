import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getMessages } from "@/lib/actions/chat"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const channelId = searchParams.get("channelId")
  const after = searchParams.get("after") ?? undefined

  if (!channelId) return NextResponse.json({ error: "channelId requis" }, { status: 400 })

  const messages = await getMessages(channelId, after)
  return NextResponse.json({ messages })
}
