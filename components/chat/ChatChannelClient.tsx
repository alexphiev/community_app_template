"use client"

import { useState, useEffect, useRef } from "react"
import { MessageBubble } from "./MessageBubble"
import { MessageComposer } from "./MessageComposer"
import { NotifPrefPanel } from "./NotifPrefPanel"

type Message = {
  id: string
  body: string
  createdAt: Date
  editedAt: Date | null
  author: { id: string; name: string | null; image: string | null }
}

type Channel = { id: string; name: string; description: string | null; type: string }

interface ChatChannelClientProps {
  channel: Channel
  initialMessages: Message[]
  channelId: string
}

export function ChatChannelClient({ channel, initialMessages, channelId }: ChatChannelClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [showInfo, setShowInfo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTimestampRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt?.toISOString())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({ channelId })
        if (lastTimestampRef.current) params.set("after", lastTimestampRef.current)
        const res = await fetch(`/api/chat/messages?${params}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.messages?.length > 0) {
          setMessages((prev) => [...prev, ...data.messages])
          lastTimestampRef.current = data.messages.at(-1)?.createdAt
        }
      } catch {
        // ignore network errors silently
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [channelId])

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-teal-700 text-[20px]" aria-hidden="true">tag</span>
            <div>
              <h2 className="text-[16px] font-bold text-teal-900">{channel.name}</h2>
              {channel.description && (
                <p className="text-[12px] text-on-surface-variant">{channel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo((s) => !s)}
              className="p-2 hover:bg-surface-container rounded-full transition-all text-on-surface-variant"
              aria-label="Informations du canal"
              aria-pressed={showInfo}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">info</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col" role="log" aria-label="Messages du canal" aria-live="polite">
          <div className="flex-1" />
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isAlternate={i % 2 === 1}
            />
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-16 text-on-surface-variant text-[14px]">
              Aucun message pour l'instant. Soyez le premier à écrire !
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <MessageComposer channelId={channelId} placeholder={`Répondre à #${channel.name}`} />
      </div>

      {showInfo && (
        <NotifPrefPanel
          channelId={channelId}
          channelName={channel.name}
          currentPref="all"
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}
