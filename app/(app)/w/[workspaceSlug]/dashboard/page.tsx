import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getKpiProposals } from "@/lib/db/kpis"
import { KpiTile } from "@/components/dashboard/KpiTile"
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard"
import Link from "next/link"
import { Plus, Database, TrendingUp, Plug } from "lucide-react"

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

  const [kpis, { count: datasetCount }, { count: integrationCount }] = await Promise.all([
    getKpiProposals(workspace.id),
    adminClient.from("datasets").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    adminClient.from("integrations").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "active"),
  ])

  const stats = [
    { label: "KPIs tracked",     value: kpis.length,             icon: TrendingUp, color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Datasets",          value: datasetCount ?? 0,       icon: Database,   color: "text-violet-600",  bg: "bg-violet-50" },
    { label: "Live integrations", value: integrationCount ?? 0,   icon: Plug,       color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {workspace.industry
              ? `AI-generated insights for ${workspace.industry.toLowerCase()} · ${workspace.name}`
              : `AI-generated insights · ${workspace.name}`}
          </p>
        </div>
        <Link
          href={`/w/${workspaceSlug}/data/upload`}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={15} />
          Add data
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={17} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* KPI grid */}
      {kpis.length === 0 ? (
        <EmptyDashboard workspaceSlug={workspaceSlug} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <KpiTile key={kpi.id} kpi={kpi} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      )}
    </div>
  )
}
