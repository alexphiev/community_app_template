import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

const ADMIN_NAV = [
  { href: "/admin/users",      label: "Utilisateurs",  icon: "group" },
  { href: "/admin/moderation", label: "Modération",    icon: "shield" },
  { href: "/admin/taxonomy",   label: "Taxonomie",     icon: "sell" },
  { href: "/admin/analytics",  label: "Analytiques",   icon: "bar_chart" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "admin_ij_pdl") redirect("/dashboard")

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Administration
        </h1>
        <nav className="flex gap-1 bg-surface-container rounded-lg p-1 w-fit" aria-label="Navigation admin">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
