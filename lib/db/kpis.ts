import { createClient } from "@/lib/supabase/server"
import type { KpiProposal } from "@/lib/types"

export async function getKpiProposals(workspaceId: string): Promise<KpiProposal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("kpi_proposals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
  return (data as KpiProposal[]) ?? []
}
