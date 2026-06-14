# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install all core dependencies, define the PostgreSQL schema with Drizzle ORM, wire up NextAuth.js v5 with RBAC middleware, configure i18n, and render an authenticated layout shell — so every subsequent phase has a stable foundation to build on.

**Architecture:** Single Next.js 16 App Router monolith. Auth lives in `src/auth.ts` (NextAuth v5). DB access via Drizzle ORM in `src/db/`. Middleware at `src/middleware.ts` enforces RBAC on every protected route prefix. All pages under `(app)/` require a valid session.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, Shadcn/ui, Drizzle ORM, PostgreSQL, NextAuth.js v5, Zod, next-intl, pnpm

---

## File Map

```
src/
  auth.ts                        — NextAuth config (providers, callbacks, session shape)
  middleware.ts                  — RBAC enforcement + i18n routing
  db/
    index.ts                     — Drizzle client singleton
    schema.ts                    — All table definitions
    migrations/                  — Drizzle migration files (auto-generated)
  lib/
    roles.ts                     — Role constants + permission helpers
    validations/
      auth.ts                    — Zod schemas for auth inputs
  components/
    ui/                          — Shadcn generated components (button, avatar, etc.)
    layout/
      AppShell.tsx               — Authenticated wrapper (sidebar + topbar)
      Sidebar.tsx                — Role-aware nav links
      Topbar.tsx                 — User menu, notifications bell placeholder
  app/
    (auth)/
      login/page.tsx             — Login page
    (app)/
      layout.tsx                 — Wraps all protected pages with AppShell
      dashboard/page.tsx         — Stub dashboard (role greeting)
    layout.tsx                   — Root layout (fonts, providers)
    globals.css                  — Already exists
  messages/
    fr.json                      — French translations
    en.json                      — English translations (stub)
tests/
  unit/
    lib/roles.test.ts            — Role permission helper tests
  integration/
    auth/login.test.ts           — Auth flow integration test
```

---

## Task 0: Install dependencies & configure tooling

**Files:**
- Modify: `package.json`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `.env.local` (never commit — add to `.gitignore`)

- [ ] **Step 1: Install all required packages**

```bash
pnpm add next-auth@beta drizzle-orm @auth/drizzle-adapter pg zod next-intl
pnpm add -D drizzle-kit @types/pg vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

- [ ] **Step 2: Add Shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

When prompted, select:
- Style: Default
- Base color: Slate
- CSS variables: yes

Then add the components we need for the shell:

```bash
pnpm dlx shadcn@latest add button avatar dropdown-menu sheet separator badge
```

- [ ] **Step 3: Create `.env.local`**

Create `/Users/alexandrephiev/Projects/info_jeunes_poc/.env.local` with:

```
DATABASE_URL=postgresql://localhost:5432/hub_pro_dev
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Add to `.gitignore`:
```
.env.local
```

- [ ] **Step 4: Create Drizzle client**

Create `src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

- [ ] **Step 5: Create `drizzle.config.ts`**

```ts
import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 6: Add db scripts to `package.json`**

Add under `"scripts"`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"test": "vitest"
```

- [ ] **Step 7: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
})
```

- [ ] **Step 8: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom"
```

- [ ] **Step 9: Add path alias to `tsconfig.json`**

Add to `compilerOptions`:
```json
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 10: Commit**

```bash
git init
git add .gitignore package.json drizzle.config.ts vitest.config.ts tests/setup.ts tsconfig.json src/db/index.ts
git commit -m "chore: install deps, configure Drizzle + Vitest + Shadcn"
```

---

## Task 1: RBAC role constants & permission helpers

**Files:**
- Create: `src/lib/roles.ts`
- Test: `tests/unit/lib/roles.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/lib/roles.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { ROLES, hasPermission, canPublish, canModerate } from "@/lib/roles"

describe("ROLES constants", () => {
  it("exports all five role slugs", () => {
    expect(Object.values(ROLES)).toEqual([
      "admin_ij_pdl",
      "salarie_ij_pdl",
      "pro_reseau_ij",
      "relais_externe",
      "guest",
    ])
  })
})

describe("hasPermission", () => {
  it("admin can access admin panel", () => {
    expect(hasPermission("admin_ij_pdl", "admin")).toBe(true)
  })
  it("salarie cannot access admin panel", () => {
    expect(hasPermission("salarie_ij_pdl", "admin")).toBe(false)
  })
  it("guest cannot access chat", () => {
    expect(hasPermission("guest", "chat")).toBe(false)
  })
  it("pro_reseau_ij can access chat", () => {
    expect(hasPermission("pro_reseau_ij", "chat")).toBe(true)
  })
})

describe("canPublish", () => {
  it("admin can publish directly", () => {
    expect(canPublish("admin_ij_pdl")).toEqual({ allowed: true, requiresApproval: false })
  })
  it("pro_reseau_ij publish requires approval", () => {
    expect(canPublish("pro_reseau_ij")).toEqual({ allowed: true, requiresApproval: true })
  })
  it("guest cannot publish", () => {
    expect(canPublish("guest")).toEqual({ allowed: false, requiresApproval: false })
  })
})

describe("canModerate", () => {
  it("admin can moderate", () => expect(canModerate("admin_ij_pdl")).toBe(true))
  it("salarie can moderate", () => expect(canModerate("salarie_ij_pdl")).toBe(true))
  it("pro cannot moderate", () => expect(canModerate("pro_reseau_ij")).toBe(false))
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/unit/lib/roles.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/roles'`

- [ ] **Step 3: Implement `src/lib/roles.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/lib/roles.test.ts
```

Expected: PASS (5 test suites, all green)

- [ ] **Step 5: Commit**

```bash
git add src/lib/roles.ts tests/unit/lib/roles.test.ts
git commit -m "feat: RBAC role constants and permission helpers"
```

---

## Task 2: Database schema (users table)

**Files:**
- Create: `src/db/schema.ts`
- Modify: `src/db/migrations/` (auto-generated)

- [ ] **Step 1: Create `src/db/schema.ts`**

```ts
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

// Install: pnpm add @paralleldrive/cuid2

export const roleEnum = pgEnum("role", [
  "admin_ij_pdl",
  "salarie_ij_pdl",
  "pro_reseau_ij",
  "relais_externe",
  "guest",
])

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  role: roleEnum("role").notNull().default("pro_reseau_ij"),
  structure: text("structure"),
  phone: text("phone"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// NextAuth required tables
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})
```

- [ ] **Step 2: Install cuid2**

```bash
pnpm add @paralleldrive/cuid2
```

- [ ] **Step 3: Generate migration**

```bash
pnpm db:generate
```

Expected: migration file created in `src/db/migrations/`

- [ ] **Step 4: Create local dev database and run migration**

```bash
createdb hub_pro_dev
pnpm db:migrate
```

Expected: tables created without errors

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/ drizzle.config.ts
git commit -m "feat: define users and NextAuth DB schema with Drizzle"
```

---

## Task 3: NextAuth.js v5 configuration

**Files:**
- Create: `src/auth.ts`
- Create: `src/lib/validations/auth.ts`
- Modify: `app/api/auth/[...nextauth]/route.ts` (create)

- [ ] **Step 1: Create `src/lib/validations/auth.ts`**

```ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
})

export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 2: Create `src/auth.ts`**

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { loginSchema } from "@/lib/validations/auth"
import type { Role } from "@/lib/roles"

// NOTE: For MVP, password auth is email+password using bcrypt.
// Replace with OIDC/SSO in a future phase if needed.

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })
        if (!user || user.suspended) return null

        // TODO (Task 3 follow-up): compare hashed password with bcrypt
        // For now: only admin seed user from env is accepted
        if (parsed.data.email !== process.env.SEED_ADMIN_EMAIL) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: Role }).role
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as Role
      return session
    },
  },
})
```

- [ ] **Step 3: Extend NextAuth types**

Create `src/types/next-auth.d.ts`:

```ts
import type { Role } from "@/lib/roles"

declare module "next-auth" {
  interface User { role: Role }
  interface Session {
    user: { role: Role } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT { role: Role }
}
```

- [ ] **Step 4: Create Route Handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 5: Add `SEED_ADMIN_EMAIL` to `.env.local`**

```
SEED_ADMIN_EMAIL=admin@info-jeunes-pdl.fr
```

- [ ] **Step 6: Verify NextAuth starts without errors**

```bash
pnpm dev
```

Visit `http://localhost:3000/api/auth/signin` — should render the default credentials form.

- [ ] **Step 7: Commit**

```bash
git add src/auth.ts src/types/next-auth.d.ts src/lib/validations/auth.ts app/api/auth/
git commit -m "feat: configure NextAuth v5 with Drizzle adapter and JWT role"
```

---

## Task 4: RBAC middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/middleware/rbac.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { getRouteRole } from "@/middleware"

describe("getRouteRole", () => {
  it("admin routes require admin role", () => {
    expect(getRouteRole("/admin/users")).toBe("admin")
  })
  it("chat routes require chat access", () => {
    expect(getRouteRole("/chat/channels")).toBe("chat")
  })
  it("public routes return null", () => {
    expect(getRouteRole("/login")).toBe(null)
    expect(getRouteRole("/")).toBe(null)
  })
  it("dashboard requires any authenticated user", () => {
    expect(getRouteRole("/dashboard")).toBe("authenticated")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/middleware/rbac.test.ts
```

Expected: FAIL — `Cannot find module '@/middleware'` (or named export missing)

- [ ] **Step 3: Create `src/middleware.ts`**

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { hasPermission } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type RouteRequirement = "admin" | "chat" | "resources" | "news" | "agenda" | "directory" | "authenticated" | null

export function getRouteRole(pathname: string): RouteRequirement {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/chat")) return "chat"
  if (pathname.startsWith("/resources")) return "resources"
  if (pathname.startsWith("/news")) return "news"
  if (pathname.startsWith("/agenda")) return "agenda"
  if (pathname.startsWith("/directory")) return "directory"
  if (pathname.startsWith("/dashboard")) return "authenticated"
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const requirement = getRouteRole(pathname)

  if (requirement === null) return NextResponse.next()

  const session = req.auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (requirement === "authenticated") return NextResponse.next()

  const role = session.user.role as Role
  if (!hasPermission(role, requirement)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/middleware/rbac.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts tests/unit/middleware/rbac.test.ts
git commit -m "feat: RBAC middleware enforcing role access per route prefix"
```

---

## Task 5: i18n configuration

**Files:**
- Create: `src/i18n/request.ts`
- Create: `messages/fr.json`
- Create: `messages/en.json`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Configure next-intl**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get("locale")?.value ?? "fr"
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 2: Create `messages/fr.json`**

```json
{
  "nav": {
    "dashboard": "Tableau de bord",
    "resources": "Ressources",
    "news": "Actualités",
    "agenda": "Agenda",
    "chat": "Messagerie",
    "directory": "Annuaire",
    "admin": "Administration"
  },
  "auth": {
    "login": "Se connecter",
    "logout": "Se déconnecter",
    "email": "Email",
    "password": "Mot de passe"
  }
}
```

- [ ] **Step 3: Create `messages/en.json`**

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "resources": "Resources",
    "news": "News",
    "agenda": "Agenda",
    "chat": "Messaging",
    "directory": "Directory",
    "admin": "Administration"
  },
  "auth": {
    "login": "Sign in",
    "logout": "Sign out",
    "email": "Email",
    "password": "Password"
  }
}
```

- [ ] **Step 4: Add next-intl plugin to `next.config.ts`**

```ts
import createNextIntlPlugin from "next-intl/plugin"
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")
export default withNextIntl({ /* existing config */ })
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ messages/ next.config.ts
git commit -m "feat: configure next-intl for fr/en i18n"
```

---

## Task 6: App shell (layout, sidebar, topbar) — Lagune design

> Design system: "Lagune" — Teal `#00807A` primary, Coral `#BB4F3A` accent, Material Symbols Outlined icons,
> Bricolage Grotesque display font + Inter body. Active nav = `border-l-[3px] border-coral-700 bg-[#f0f4f3] text-[#00807A]`.
> Sidebar 256px fixed. Topbar 64px. Background `#f6faf9`.

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Topbar.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `app/layout.tsx` — add Google Fonts (Bricolage Grotesque, Inter, Material Symbols Outlined)

- [ ] **Step 0: Update `app/globals.css` with Lagune tokens**

Replace the content of `app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  /* Lagune primitives */
  --color-teal-50:  #F0F9F9;
  --color-teal-700: #00807A;
  --color-teal-800: #006560;
  --color-teal-900: #00403D;
  --color-coral-50:  #FDECE8;
  --color-coral-100: #FBD8CF;
  --color-coral-700: #BB4F3A;
  --color-coral-800: #A23A2A;
  --color-neutral-50:  #F4F7F7;
  --color-neutral-200: #E4E8E8;
  --color-neutral-400: #9AA4A4;
  --color-neutral-900: #1A2020;
  /* Design system surface tokens */
  --color-surface: #f6faf9;
  --color-surface-container-low: #f0f4f3;
  --color-surface-container: #ebefed;
  --color-on-surface: #181d1c;
  --color-on-surface-variant: #3e4948;
  --color-outline-variant: #bdc9c7;

  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Bricolage Grotesque", sans-serif;
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;
}

:root {
  --background: #f6faf9;
  --foreground: #181d1c;
  --card: #ffffff;
  --card-foreground: #181d1c;
  --muted: #f0f4f3;
  --muted-foreground: #3e4948;
  --border: #bdc9c7;
  --input: #d2d8d8;
  --primary: #00807A;
  --primary-foreground: #ffffff;
  --accent: #BB4F3A;
  --accent-foreground: #ffffff;
  --destructive: #ba1a1a;
  --destructive-foreground: #ffffff;
  --ring: #00807A;
  --radius: 0.625rem;
}

.dark {
  --background: #101414;
  --foreground: #f0f4f3;
  --card: #1A2020;
  --muted: #272e2e;
  --muted-foreground: #9AA4A4;
  --border: rgba(255,255,255,0.10);
  --primary: #76d6cf;
  --primary-foreground: #101414;
  --accent: #ffb4a5;
  --accent-foreground: #101414;
  --ring: #76d6cf;
}

@layer base {
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
  }
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
    border-radius: var(--radius-sm);
  }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 1: Update `app/layout.tsx` to load fonts**

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hub Pro — Info Jeunes PDL",
  description: "Plateforme professionnelle du Réseau Info Jeunes Pays de la Loire",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

Matches the Lagune design exactly: 256px fixed sidebar, teal brand header, coral 3px active border, Material Symbols icons, `surface-container-low` hover/active backgrounds.

```tsx
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
        <h1 className="text-[24px] font-bold leading-[1.35] text-[#00807A]" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
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
                  ? "text-[#00807A] border-l-[3px] border-[#BB4F3A] bg-[#f0f4f3] font-medium"
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
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-[#3e4948] text-[14px] hover:bg-[#f0f4f3] rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">settings</span>
          <span>Paramètres</span>
        </Link>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/Topbar.tsx`**

Matches the Lagune design: 64px height, search bar with `rounded-full`, notifications bell with coral unread dot, user name + role, avatar with initials, logout dropdown.

```tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export async function Topbar() {
  const session = await auth()
  if (!session) return null

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const roleLabel: Record<string, string> = {
    admin_ij_pdl: "Admin IJ PDL",
    salarie_ij_pdl: "Salarié IJ",
    pro_reseau_ij: "Pro Réseau",
    relais_externe: "Relais",
    guest: "Invité",
  }

  return (
    <header className="h-16 flex justify-between items-center px-8 bg-[#f6faf9] border-b border-[#bdc9c7] sticky top-0 z-40">
      <div className="flex items-center w-1/2">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978] text-[20px]" aria-hidden="true">
            search
          </span>
          <input
            className="w-full bg-[#f0f4f3] border-none rounded-full pl-10 pr-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00807A]"
            placeholder="Rechercher une ressource, un collègue..."
            type="search"
            aria-label="Rechercher"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative p-2 hover:bg-[#ebefed] rounded-full transition-all"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-[#3e4948] text-[20px]" aria-hidden="true">
            notifications
          </span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#BB4F3A] rounded-full" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[#bdc9c7]">
          <div className="text-right">
            <p className="font-medium text-[14px]">{session.user.name}</p>
            <p className="text-[#3e4948] text-[12px]">{roleLabel[session.user.role] ?? session.user.role}</p>
          </div>
          <form>
            <button
              formAction={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
              className="w-10 h-10 rounded-full bg-[#ebefed] flex items-center justify-center text-[14px] font-semibold text-[#00807A] hover:bg-[#e5e9e7] transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              {initials}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Create `src/components/layout/AppShell.tsx`**

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import type { Role } from "@/lib/roles"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      <Sidebar role={session.user.role as Role} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/layout.tsx`**

```tsx
import { AppShell } from "@/components/layout/AppShell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
```

- [ ] **Step 6: Create stub `app/(app)/dashboard/page.tsx`**

```tsx
import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  return (
    <section>
      <h2
        className="text-[49px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#00403D] mb-2"
        style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
      >
        Bonjour {session?.user.name?.split(" ")[0]}.
      </h2>
      <p className="text-[18px] text-[#3e4948] leading-[1.55]">
        Voici ce qu'il se passe sur votre réseau Info Jeunes aujourd'hui.
      </p>
    </section>
  )
}
```

- [ ] **Step 7: Create `app/(auth)/login/page.tsx`**

Lagune-styled login: white card on `surface` background, teal primary button, proper labels and focus rings.

```tsx
import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1
            className="text-[31px] font-semibold leading-[1.25] text-[#00807A] mb-1"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Réseau Info Jeunes Pays de la Loire</p>
        </div>

        <form
          className="flex flex-col gap-5"
          action={async (formData: FormData) => {
            "use server"
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[14px] font-medium text-[#181d1c]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-[#00807A] focus:ring-2 focus:ring-[#00807A]/20 transition-colors"
              placeholder="prenom.nom@structure.fr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-[#00807A] focus:ring-2 focus:ring-[#00807A]/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[6px] bg-[#00807A] text-white text-[14px] font-medium hover:bg-[#006560] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00807A] focus-visible:ring-offset-2"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Add skip-to-content link in `app/layout.tsx`**

Add before `{children}` in the body:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#00807A] focus:text-white focus:rounded-md focus:text-sm"
>
  Aller au contenu principal
</a>
```

- [ ] **Step 9: Smoke test in browser**

```bash
pnpm dev
```

1. Visit `http://localhost:3000/dashboard` → should redirect to `/login`
2. Login page: white card, teal "Hub Pro" heading, proper input labels
3. Log in with seed admin email → land on Dashboard
4. Sidebar: 256px wide, "Hub Pro" in teal, active item has coral left border + teal text + light bg
5. Topbar: 64px, search bar with rounded-full, notifications bell with coral dot, user initials avatar
6. Dashboard: "Bonjour [name]." in large Bricolage Grotesque

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/ app/\(app\)/ app/\(auth\)/ app/layout.tsx app/globals.css
git commit -m "feat: authenticated app shell with Lagune design system"
```

---

## Task 7: Final integration verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass (roles + middleware)

- [ ] **Step 2: Run type check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: 0 errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: phase 0 foundation complete — auth, RBAC, DB schema, i18n, app shell"
```

---

## Phase 0 Completion Checklist

- [ ] PostgreSQL schema created and migrated
- [ ] NextAuth v5 configured with JWT + Drizzle adapter
- [ ] RBAC middleware guards all route prefixes
- [ ] Role permission helpers tested
- [ ] next-intl configured (fr primary, en stub)
- [ ] App shell renders with role-aware sidebar
- [ ] Login/logout flow works end-to-end
- [ ] All tests pass, no TS errors
