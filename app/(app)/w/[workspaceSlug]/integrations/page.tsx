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
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  return (
    <IntegrationsPage
      workspace={{ id: workspace.id, slug: workspace.slug, name: workspace.name }}
      integrations={(integrations ?? []) as Integration[]}
    />
  )
}
