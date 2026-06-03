"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type Tag = { id: string; name: string; slug: string }

interface ResourceFilterProps {
  tags: Tag[]
  selectedTagIds: string[]
  selectedTypes: string[]
  onTagToggle: (id: string) => void
  onTypeToggle: (type: string) => void
}

const MEDIA_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Vidéos" },
  { value: "audio", label: "Audio" },
  { value: "link", label: "Liens Web" },
]

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-outline-variant pb-4">
      <button
        type="button"
        className="w-full flex items-center justify-between py-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-[16px] font-semibold text-on-surface">{title}</span>
        <span
          className={cn(
            "material-symbols-outlined text-[#6e7978] transition-transform duration-200",
            !open && "rotate-180"
          )}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function ResourceFilter({
  tags,
  selectedTagIds,
  selectedTypes,
  onTagToggle,
  onTypeToggle,
}: ResourceFilterProps) {
  return (
    <aside className="w-72 flex-shrink-0 space-y-6" aria-label="Filtres">
      <div className="space-y-4">
        <FilterSection title="Type de document">
          <div className="space-y-2">
            {MEDIA_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded border-outline-variant text-teal-700 focus:ring-teal-700"
                  checked={selectedTypes.includes(t.value)}
                  onChange={() => onTypeToggle(t.value)}
                />
                <span className="text-[14px] text-on-surface-variant group-hover:text-teal-700 transition-colors">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {tags.length > 0 && (
          <FilterSection title="Thématique">
            <div className="grid grid-cols-1 gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onTagToggle(tag.id)}
                    className={cn(
                      "text-left px-3 py-1.5 rounded text-[12px] font-medium flex items-center justify-between transition-colors",
                      selected
                        ? "bg-teal-100 text-teal-900"
                        : "hover:bg-surface-container text-on-surface-variant"
                    )}
                  >
                    {tag.name}
                    {selected && (
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        close
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </FilterSection>
        )}
      </div>

      <div className="p-4 bg-teal-900 rounded-xl text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="font-semibold text-[16px] mb-1">Nouveau Document ?</h4>
          <p className="text-[12px] opacity-80 mb-4">
            Contribuez à la veille partagée du réseau.
          </p>
          <button
            type="button"
            className="bg-white text-teal-900 px-4 py-2 rounded-lg font-semibold text-[12px] shadow-sm hover:bg-teal-50 transition-colors"
          >
            Télécharger
          </button>
        </div>
        <div
          className="absolute -bottom-4 -right-4 w-20 h-20 bg-coral-700/20 rotate-[15deg] group-hover:scale-110 transition-transform"
          aria-hidden="true"
        />
      </div>
    </aside>
  )
}
