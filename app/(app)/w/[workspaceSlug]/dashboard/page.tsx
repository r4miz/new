import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getKpiProposals } from "@/lib/db/kpis"
import { KpiTile } from "@/components/dashboard/KpiTile"
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard"
import Link from "next/link"
import { Plus, BarChart2, Database, Plug } from "lucide-react"

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

  const [kpis, { count: dsCount }, { count: intCount }] = await Promise.all([
    getKpiProposals(workspace.id),
    adminClient.from("datasets").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    adminClient.from("integrations").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "active"),
  ])

  const stats = [
    { label: "KPIs tracked",      value: kpis.length,   Icon: BarChart2, color: "#0ea5e9" },
    { label: "Datasets",          value: dsCount ?? 0,  Icon: Database,  color: "#8b5cf6" },
    { label: "Live integrations", value: intCount ?? 0, Icon: Plug,      color: "#10b981" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "28px 36px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              Dashboard
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#6b7280" }}>
              {workspace.industry
                ? `${workspace.industry} analytics · ${workspace.name}`
                : `AI-powered analytics · ${workspace.name}`}
            </p>
          </div>
          <Link
            href={`/w/${workspaceSlug}/data/upload`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#0f172a", color: "white",
              fontSize: "13.5px", fontWeight: 600,
              padding: "10px 20px", borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add data
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "12px" }}>
          {stats.map(({ label, value, Icon, color }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "14px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px 20px",
              minWidth: "160px",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: color + "18",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.8px" }}>
                  {value}
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "3px" }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ flex: 1, padding: "32px 36px" }}>
        {kpis.length === 0 ? (
          <EmptyDashboard workspaceSlug={workspaceSlug} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}>
            {kpis.map((kpi) => (
              <KpiTile key={kpi.id} kpi={kpi} workspaceSlug={workspaceSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
