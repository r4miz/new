import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { IntegrationsPage } from "@/components/integrations/IntegrationsPage"
import type { Integration } from "@/lib/integrations/types"

export default async function IntegrationsRoute({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) redirect("/onboarding")

  const { data: integrations } = await adminClient
    .from("integrations").select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  return (
    <div style={{ minHeight: "100%", background: "#f1f5f9" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "28px 36px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Integrations</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#6b7280" }}>Connect your data sources. Your dashboard stays fresh automatically.</p>
        </div>
      </div>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <IntegrationsPage
            workspace={{ id: workspace.id, slug: workspace.slug, name: workspace.name }}
            integrations={(integrations ?? []) as Integration[]}
          />
        </div>
      </div>
    </div>
  )
}
