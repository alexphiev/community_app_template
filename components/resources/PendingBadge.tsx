export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral-100 text-coral-700 rounded-full text-[11px] font-semibold">
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">schedule</span>
      En attente de validation
    </span>
  )
}
