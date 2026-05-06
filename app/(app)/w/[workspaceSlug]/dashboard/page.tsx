import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getKpiProposals } from "@/lib/db/kpis"
import { KpiTile } from "@/components/dashboard/KpiTile"
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard"
import Link from "next/link"
import { Plus } from "lucide-react"

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "#f8fafc" }}>
      {/* Page header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "24px 32px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "3px 0 0" }}>
              {workspace.industry ? `${workspace.industry} · ${workspace.name}` : workspace.name}
            </p>
          </div>
          <Link href={`/w/${workspaceSlug}/data/upload`} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#0ea5e9", color: "white",
            fontSize: "13.5px", fontWeight: 600,
            padding: "9px 18px", borderRadius: "8px",
            textDecoration: "none", transition: "background 0.15s",
          }}>
            <Plus size={14} strokeWidth={2.5} />
            Add data
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { label: "KPIs tracked",      value: kpis.length   },
            { label: "Datasets",          value: dsCount ?? 0  },
            { label: "Live integrations", value: intCount ?? 0 },
          ].map((s, i) => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: "10px",
              paddingRight: i < 2 ? "24px" : 0,
              borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
            }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8", lineHeight: 1.3, maxWidth: "80px" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {kpis.length === 0 ? (
          <EmptyDashboard workspaceSlug={workspaceSlug} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {kpis.map((kpi) => (
              <KpiTile key={kpi.id} kpi={kpi} workspaceSlug={workspaceSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
