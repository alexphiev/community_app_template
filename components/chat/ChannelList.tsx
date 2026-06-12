"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Channel = { id: string; name: string; description: string | null; type: string }

interface ChannelListProps {
  channels: Channel[]
  activeChannelId?: string
}

function SectionHeader({ title }: { title: string }) {
  const [open, setOpen] = useState(true)
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-2 mb-2"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
    >
      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
        {title}
      </span>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant" aria-hidden="true">
        {open ? "expand_more" : "chevron_right"}
      </span>
    </button>
  )
}

export function ChannelList({ channels, activeChannelId }: ChannelListProps) {
  const publicChannels = channels.filter((c) => c.type === "channel")

  return (
    <div className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col h-full">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center flex-shrink-0">
        <h2
          className="text-[18px] font-bold text-teal-900"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Conversations
        </h2>
        <button
          className="text-teal-700/40 p-1 rounded cursor-not-allowed"
          aria-label="Nouvelle conversation"
          disabled
          title="Fonctionnalité à venir"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit_square</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        <div>
          <SectionHeader title="Général" />
          <div className="space-y-1">
            {publicChannels.length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-on-surface-variant">Aucun canal.</p>
            ) : (
              publicChannels.map((ch) => {
                const isActive = ch.id === activeChannelId
                return (
                  <Link
                    key={ch.id}
                    href={`/chat/channels/${ch.id}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] transition-colors",
                      isActive
                        ? "bg-white shadow-sm border-l-[3px] border-coral-700 text-teal-700 font-semibold"
                        : "hover:bg-surface-container text-on-surface-variant border-l-[3px] border-transparent"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">tag</span>
                    <span className="truncate">{ch.name}</span>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
