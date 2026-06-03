import { getChannels } from "@/lib/actions/chat"
import { ChannelList } from "@/components/chat/ChannelList"

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const channelList = await getChannels()

  return (
    <div className="-m-8 flex h-[calc(100vh-64px)] overflow-hidden">
      <ChannelList channels={channelList} />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}
