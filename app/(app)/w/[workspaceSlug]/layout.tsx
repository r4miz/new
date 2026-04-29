import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/db/workspaces"
import Link from "next/link"
import { LayoutDashboard, Database, MessageSquare, Settings, LogOut } from "lucide-react"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) redirect("/onboarding")

  const membership = await getWorkspaceMembership(workspace.id, user.id)
  if (!membership) redirect("/onboarding")

  const base = `/w/${workspaceSlug}`

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Workspace</p>
          <p className="font-semibold text-slate-900 truncate">{workspace.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <SidebarLink href={`${base}/dashboard`} icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <SidebarLink href={`${base}/data`} icon={<Database size={16} />} label="Data sources" />
          <SidebarLink href={`${base}/chat`} icon={<MessageSquare size={16} />} label="AI Chat" />
          <SidebarLink href={`${base}/settings`} icon={<Settings size={16} />} label="Settings" />
        </nav>
        <div className="p-3 border-t">
          <form action="/api/auth/signout" method="post">
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 w-full px-3 py-2 rounded-lg hover:bg-slate-100 transition">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
    >
      {icon}
      {label}
    </Link>
  )
}
