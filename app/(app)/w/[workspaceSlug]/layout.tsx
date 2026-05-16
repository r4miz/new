import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/db/workspaces"
import { UpgradeGate } from "@/components/billing/UpgradeGate"
import { AppShell } from "@/components/layout/AppShell"

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

  const status    = workspace.subscription_status
  // trialing is now treated as unsubscribed — no free trial
  const isExpired = status !== "active"

  return (
    <AppShell workspace={workspace} subscriptionStatus={status}>
      {isExpired ? (
        <UpgradeGate workspace={{ id: workspace.id, name: workspace.name }}>
          {children}
        </UpgradeGate>
      ) : (
        children
      )}
    </AppShell>
  )
}
