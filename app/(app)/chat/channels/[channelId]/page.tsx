import { notFound } from "next/navigation"
import { getChannels, getMessages } from "@/lib/actions/chat"
import { ChatChannelClient } from "@/components/chat/ChatChannelClient"

export const revalidate = 0

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  const [allChannels, initialMessages] = await Promise.all([
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
    />
  )
}
