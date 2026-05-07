import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { KpiDetail } from "@/components/dashboard/KpiDetail"
import type { KpiProposal } from "@/lib/types"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function KpiDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; id: string }>
}) {
  const { workspaceSlug, id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) redirect("/onboarding")

  const { data: kpi } = await adminClient
    .from("kpi_proposals")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle()

  if (!kpi) redirect(`/w/${workspaceSlug}/dashboard`)

  return (
    <div style={{ minHeight: "100%", background: "#07090e" }}>
      <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 36px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link
            href={`/w/${workspaceSlug}/dashboard`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569", textDecoration: "none", transition: "color 0.12s" }}
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </Link>
        </div>
      </div>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <KpiDetail kpi={kpi as KpiProposal} />
        </div>
      </div>
    </div>
  )
}
