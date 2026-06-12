import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getChannels, getMessages } from "@/lib/actions/chat"
import { ChatChannelClient } from "@/components/chat/ChatChannelClient"

export const revalidate = 0

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  const [session, allChannels, initialMessages] = await Promise.all([
    auth(),
    getChannels(),
    getMessages(channelId),
  ])

  const channel = allChannels.find((c) => c.id === channelId)
  if (!channel) notFound()

  return (
    <ChatChannelClient
      channel={channel}
      initialMessages={initialMessages}
      channelId={channelId}
      currentUser={{
        id: session!.user.id!,
        name: session!.user.name ?? null,
        image: session!.user.image ?? null,
      }}
    />
  )
}
