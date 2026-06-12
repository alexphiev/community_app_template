"use client"

import { useState, useMemo } from "react"
import { UserCard } from "./UserCard"

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  structure: string | null
  phone: string | null
  image: string | null
}

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "admin_ij_pdl", label: "Admin IJ PDL" },
  { value: "salarie_ij_pdl", label: "Salarié IJ" },
  { value: "pro_reseau_ij", label: "Pro Réseau" },
  { value: "relais_externe", label: "Relais Externe" },
]

export function DirectoryClient({ users }: { users: User[] }) {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return users.filter((u) => {
      if (role && u.role !== role) return false
      if (!q) return true
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.structure?.toLowerCase().includes(q)
      )
    })
  }, [users, query, role])

  return (
    <>
      <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[12px] font-semibold text-teal-700 mb-2 uppercase tracking-wider" htmlFor="query">
            Recherche libre
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" aria-hidden="true">
              person_search
            </span>
            <input
              id="query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all"
              placeholder="Nom, prénom, structure..."
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-[12px] font-semibold text-teal-700 mb-2 uppercase tracking-wider" htmlFor="role">
            Rôle
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full py-3 px-4 bg-white border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block" aria-hidden="true">person_search</span>
          <p className="text-[16px]">Aucun professionnel trouvé pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <UserCard key={user.id} user={{ ...user, email: user.email ?? "" }} />
          ))}
        </div>
      )}
    </>
  )
}
