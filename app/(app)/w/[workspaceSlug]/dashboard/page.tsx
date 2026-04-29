import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getKpiProposals } from "@/lib/db/kpis"
import { KpiTile } from "@/components/dashboard/KpiTile"
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard"
import Link from "next/link"

export default async function DashboardPage({
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

  const kpis = await getKpiProposals(workspace.id)

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            AI-generated KPIs for {workspace.name}
          </p>
        </div>
        <Link
          href={`/w/${workspaceSlug}/data/upload`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add data
        </Link>
      </div>

      {kpis.length === 0 ? (
        <EmptyDashboard workspaceSlug={workspaceSlug} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <KpiTile key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}
    </div>
  )
}
