"use client"

import { useState, useRef } from "react"
import { sendMessage } from "@/lib/actions/chat"

export function MessageComposer({ channelId, placeholder }: { channelId: string; placeholder: string }) {
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    try {
      await sendMessage({ channelId, body: body.trim() })
      setBody("")
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="p-6 border-t border-outline-variant flex-shrink-0">
      <form onSubmit={handleSubmit}>
        <div className="border border-outline-variant rounded-xl shadow-sm focus-within:border-teal-600 transition-all overflow-hidden">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 p-2 bg-surface-container-lowest border-b border-outline-variant/50">
            {[
              { icon: "format_bold", label: "Gras" },
              { icon: "format_italic", label: "Italique" },
              { icon: "strikethrough_s", label: "Barré" },
            ].map((btn) => (
              <button
                key={btn.icon}
                type="button"
                className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant transition-colors"
                aria-label={btn.label}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{btn.icon}</span>
              </button>
            ))}
            <div className="w-px h-4 bg-outline-variant mx-1" role="separator" />
            {[
              { icon: "link", label: "Lien" },
              { icon: "format_list_bulleted", label: "Liste" },
            ].map((btn) => (
              <button
                key={btn.icon}
                type="button"
                className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant transition-colors"
                aria-label={btn.label}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{btn.icon}</span>
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-4 text-[16px] border-none focus:ring-0 min-h-[100px] resize-none bg-white text-on-surface placeholder:text-outline"
            placeholder={placeholder}
            aria-label="Saisir un message"
            rows={3}
          />

          <div className="flex justify-between items-center px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/50">
            <div className="flex items-center gap-1">
              {["add_circle", "mood", "alternate_email"].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant transition-all"
                  aria-label={icon}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!body.trim() || sending}
              className="bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-[14px] hover:bg-teal-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
