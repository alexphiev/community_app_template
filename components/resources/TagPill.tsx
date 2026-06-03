import { cn } from "@/lib/utils"

interface TagPillProps {
  name: string
  variant?: "default" | "accent" | "brand"
  className?: string
}

const variants = {
  default: "bg-teal-100 text-teal-900",
  accent: "bg-coral-100 text-coral-700",
  brand: "bg-teal-700 text-white",
}

export function TagPill({ name, variant = "default", className }: TagPillProps) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] font-semibold leading-[1.45] tracking-[0.05em]",
        variants[variant],
        className
      )}
    >
      {name}
    </span>
  )
}
