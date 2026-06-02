export const ROLES = {
  ADMIN: "admin_ij_pdl",
  SALARIE: "salarie_ij_pdl",
  PRO_RESEAU: "pro_reseau_ij",
  RELAIS: "relais_externe",
  GUEST: "guest",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

type Feature = "admin" | "chat" | "resources" | "news" | "agenda" | "directory"

const FEATURE_ACCESS: Record<Feature, Role[]> = {
  admin: [ROLES.ADMIN],
  chat: [ROLES.ADMIN, ROLES.SALARIE, ROLES.PRO_RESEAU],
  resources: [ROLES.ADMIN, ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS],
  news: [ROLES.ADMIN, ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS],
  agenda: [ROLES.ADMIN, ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS],
  directory: [ROLES.ADMIN, ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS],
}

export function hasPermission(role: Role, feature: Feature): boolean {
  return FEATURE_ACCESS[feature].includes(role)
}

export function canPublish(role: Role): { allowed: boolean; requiresApproval: boolean } {
  if (role === ROLES.ADMIN || role === ROLES.SALARIE) return { allowed: true, requiresApproval: false }
  if (role === ROLES.PRO_RESEAU) return { allowed: true, requiresApproval: true }
  return { allowed: false, requiresApproval: false }
}

export function canModerate(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.SALARIE
}
