"use client"

import { useRef, useState, useTransition } from "react"
import { updateProfile } from "@/lib/actions/auth"

type Props = {
  name: string
  email: string
  phone: string | null
  structure: string | null
  role: string
}

const roleLabel: Record<string, string> = {
  admin_ij_pdl: "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij: "Pro Réseau",
  relais_externe: "Relais",
  guest: "Invité",
}

export function ProfileForm({ name, email, phone, structure, role }: Props) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Profil mis à jour." })
      }
    })
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6">
      <h2 className="text-[15px] font-semibold text-[#181d1c] mb-4">Informations personnelles</h2>

      {message && (
        <p className={`mb-4 rounded-[6px] px-3 py-2 text-[13px] ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[12px] font-medium text-[#181d1c]">Nom complet</label>
            <input id="name" name="name" type="text" required defaultValue={name}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#181d1c]">Email</label>
            <div className="h-9 rounded-[6px] border border-[#e5eaea] bg-[#f9fafb] px-3 flex items-center gap-2 text-[13px] text-[#6e7978]">
              {email}
              <span className="text-[10px] bg-[#e5f9f6] text-teal-700 px-1.5 py-0.5 rounded-[4px]">vérifié</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-[12px] font-medium text-[#181d1c]">Téléphone</label>
            <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="06 12 34 56 78" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="structure" className="text-[12px] font-medium text-[#181d1c]">Structure</label>
            <input id="structure" name="structure" type="text" defaultValue={structure ?? ""}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="PIJ Nantes" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#181d1c]">Rôle</label>
          <div className="h-9 rounded-[6px] border border-[#e5eaea] bg-[#f9fafb] px-3 flex items-center text-[13px] text-[#6e7978] gap-2">
            {roleLabel[role] ?? role}
            <span className="text-[11px] text-[#9ea8a7]">(modifiable par un admin)</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="h-9 px-5 rounded-[6px] bg-teal-700 text-white text-[13px] font-medium hover:bg-teal-800 disabled:opacity-50 transition-all">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  )
}
