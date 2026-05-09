import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/db/workspaces"
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

  const status    = workspace.subscription_status
  // trialing is now treated as unsubscribed — no free trial
  const isExpired = status !== "active"

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#060d1a" }}>
      <Sidebar workspace={workspace} subscriptionStatus={status} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, overflowY: "auto" }}>
        {isExpired ? (
          <UpgradeGate workspace={{ id: workspace.id, name: workspace.name }}>
            {children}
          </UpgradeGate>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
