import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/db/workspaces"
import { getDaysLeft } from "@/lib/billing"
import { TrialBanner } from "@/components/billing/TrialBanner"
import { UpgradeGate } from "@/components/billing/UpgradeGate"
import { Sidebar } from "@/components/layout/Sidebar"

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

  const status     = workspace.subscription_status
  const daysLeft   = getDaysLeft(workspace.trial_ends_at)
  const isTrialing = status === "trialing" && daysLeft > 0
  const isExpired  = status === "expired" || status === "canceled" ||
                     (status === "trialing" && daysLeft === 0) ||
                     status === "past_due"

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        workspace={workspace}
        daysLeft={daysLeft}
        subscriptionStatus={status}
      />

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
