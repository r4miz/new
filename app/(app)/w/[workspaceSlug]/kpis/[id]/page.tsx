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
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <Link
        href={`/w/${workspaceSlug}/dashboard`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Dashboard
      </Link>

      <KpiDetail kpi={kpi as KpiProposal} />
    </div>
  )
}
