import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/db/workspaces"
import { getDaysLeft } from "@/lib/billing"
import { TrialBanner } from "@/components/billing/TrialBanner"
import { UpgradeGate } from "@/components/billing/UpgradeGate"
import Link from "next/link"
import { LayoutDashboard, Database, MessageSquare, Settings, LogOut, CreditCard, Plug } from "lucide-react"

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

  const status      = workspace.subscription_status
  const daysLeft    = getDaysLeft(workspace.trial_ends_at)
  const isTrialing  = status === "trialing" && daysLeft > 0
  const isExpired   = status === "expired" || status === "canceled" ||
                      (status === "trialing" && daysLeft === 0) ||
                      status === "past_due"

  const base = `/w/${workspaceSlug}`

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Workspace</p>
          <p className="font-semibold text-slate-900 truncate text-sm">{workspace.name}</p>
          {isTrialing && (
            <span className="mt-1 inline-block text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {daysLeft}d trial left
            </span>
          )}
          {status === "active" && (
            <span className="mt-1 inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              Active
            </span>
          )}
          {isExpired && (
            <span className="mt-1 inline-block text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
              Trial ended
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <SidebarLink href={`${base}/dashboard`}   icon={<LayoutDashboard size={15} />} label="Dashboard" />
          <SidebarLink href={`${base}/data/upload`}   icon={<Database size={15} />}       label="Data sources" />
          <SidebarLink href={`${base}/integrations`} icon={<Plug size={15} />}           label="Integrations" />
          <SidebarLink href={`${base}/chat`}         icon={<MessageSquare size={15} />}  label="AI Chat" />
          <div className="pt-2 mt-2 border-t border-slate-100">
            <SidebarLink href={`${base}/settings/billing`} icon={<CreditCard size={15} />} label="Billing" />
            <SidebarLink href={`${base}/settings`}         icon={<Settings size={15} />}   label="Settings" />
          </div>
        </nav>

        <div className="p-3 border-t">
          <form action="/api/auth/signout" method="post">
            <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 w-full px-3 py-2 rounded-lg hover:bg-slate-100 transition">
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isTrialing && (
          <TrialBanner daysLeft={daysLeft} workspaceSlug={workspaceSlug} />
        )}

        <main className="flex-1 overflow-auto flex flex-col">
          {isExpired ? (
            <UpgradeGate workspace={{ id: workspace.id, name: workspace.name }}>
              {children}
            </UpgradeGate>
          ) : (
            children
          )}
        </main>
      </div>
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
      className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </Link>
  )
}
