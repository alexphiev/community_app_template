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
