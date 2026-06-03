"use client"

import { useState } from "react"
import { updateNotifPref } from "@/lib/actions/chat"
import { cn } from "@/lib/utils"

type Pref = "all" | "mentions" | "digest" | "muted"

const PREFS: { value: Pref; label: string; sub: string }[] = [
  { value: "all",      label: "Toutes les alertes",   sub: "Recevoir toutes les notifications" },
  { value: "mentions", label: "Mentions seulement",   sub: "Uniquement quand @mentionné" },
  { value: "digest",   label: "Résumé quotidien",     sub: "Un email récapitulatif par jour" },
  { value: "muted",    label: "Muet",                 sub: "Aucune notification" },
]

export function NotifPrefPanel({
  channelId,
  channelName,
  currentPref,
  onClose,
}: {
  channelId: string
  channelName: string
  currentPref: Pref
  onClose: () => void
}) {
  const [pref, setPref] = useState<Pref>(currentPref)
  const [saving, setSaving] = useState(false)

  async function handleChange(p: Pref) {
    setSaving(true)
    setPref(p)
    await updateNotifPref({ channelId, pref: p })
    setSaving(false)
  }

  return (
    <div className="w-80 border-l border-outline-variant bg-surface flex flex-col h-full">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center">
        <h3
          className="text-[18px] font-semibold text-teal-900"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Détails du canal
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-container rounded transition-colors"
          aria-label="Fermer les détails"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <section>
          <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            Notifications
          </h4>
          <div className="space-y-2">
            {PREFS.map((p) => (
              <label
                key={p.value}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                  pref === p.value
                    ? "border-teal-700 bg-teal-50"
                    : "border-outline-variant hover:border-teal-700"
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-on-surface">{p.label}</p>
                  <p className="text-[12px] text-on-surface-variant">{p.sub}</p>
                </div>
                <input
                  type="radio"
                  name="notif-pref"
                  value={p.value}
                  checked={pref === p.value}
                  onChange={() => handleChange(p.value)}
                  className="text-teal-700 focus:ring-teal-700"
                  aria-label={p.label}
                  disabled={saving}
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
