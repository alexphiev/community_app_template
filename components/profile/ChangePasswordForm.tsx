"use client"

import { useRef, useState, useTransition } from "react"
import { changePassword } from "@/lib/actions/auth"

export function ChangePasswordForm() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await changePassword(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Mot de passe mis à jour." })
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6">
      <h2 className="text-[15px] font-semibold text-[#181d1c] mb-4">Changer le mot de passe</h2>

      {message && (
        <p className={`mb-4 rounded-[6px] px-3 py-2 text-[13px] ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentPassword" className="text-[12px] font-medium text-[#181d1c]">Mot de passe actuel</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="••••••••" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-[12px] font-medium text-[#181d1c]">Nouveau mot de passe</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="8 caractères minimum" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-[12px] font-medium text-[#181d1c]">Confirmer le mot de passe</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="••••••••" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="h-9 px-5 rounded-[6px] bg-teal-700 text-white text-[13px] font-medium hover:bg-teal-800 disabled:opacity-50 transition-all">
            {isPending ? "Mise à jour…" : "Changer le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  )
}
