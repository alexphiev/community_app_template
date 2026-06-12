"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { hasPermission } from "@/lib/roles"
import type { Role } from "@/lib/roles"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: "dashboard", feature: "authenticated" as const },
  { label: "Actualités", href: "/news", icon: "feed", feature: "news" as const },
  { label: "Boîte à Outils", href: "/resources", icon: "home_repair_service", feature: "resources" as const },
  { label: "Agenda", href: "/agenda", icon: "calendar_month", feature: "agenda" as const },
  { label: "Messagerie", href: "/chat", icon: "chat", feature: "chat" as const },
  { label: "Annuaire", href: "/directory", icon: "contact_phone", feature: "directory" as const },
  { label: "Administration", href: "/admin", icon: "admin_panel_settings", feature: "admin" as const },
] as const

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.feature === "authenticated" ? true : hasPermission(role, item.feature)
  )

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6faf9] shadow-sm flex flex-col py-6 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-[24px] font-bold leading-[1.35] text-teal-700" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          Hub Pro
        </h1>
        <p className="text-[#3e4948] text-[12px] font-medium">Info Jeunes</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-[14px] transition-colors",
                isActive
                  ? "text-teal-700 border-l-[3px] border-coral-700 bg-[#f0f4f3] font-medium"
                  : "text-[#3e4948] hover:bg-[#f0f4f3] border-l-[3px] border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-4 space-y-1">
        <div
          title="Fonctionnalité à venir"
          className="flex items-center gap-3 px-4 py-3 text-[#3e4948]/40 text-[14px] rounded-lg cursor-not-allowed select-none"
          aria-disabled="true"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">settings</span>
          <span>Paramètres</span>
        </div>
      </div>
    </aside>
  )
}
