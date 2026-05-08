import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getKpiProposals } from "@/lib/db/kpis"
import { KpiTile } from "@/components/dashboard/KpiTile"
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard"
import Link from "next/link"
import { Plus, BarChart2, Database, Plug } from "lucide-react"
import { T } from "@/lib/theme"

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
    { label: "KPIs",        value: kpis.length,   Icon: BarChart2, color: T.accent },
    { label: "Datasets",    value: dsCount ?? 0,  Icon: Database,  color: T.purple },
    { label: "Integrations",value: intCount ?? 0, Icon: Plug,      color: T.green  },
  ]

  return (
    <div style={{ minHeight: "100%", background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "20px 28px", flexShrink: 0,
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>

          {/* Title + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>
                Dashboard
              </h1>
              {workspace.industry && (
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.textMuted }}>
                  {workspace.industry}
                </p>
              )}
            </div>

            {/* Inline stat pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {stats.map(({ label, value, Icon, color }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: "8px", padding: "7px 12px",
                }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                    {value}
                  </span>
                  <span style={{ fontSize: "12px", color: T.textMuted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link href={`/w/${workspaceSlug}/data/upload`} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: T.accent, color: "white",
            fontSize: "13px", fontWeight: 700,
            padding: "9px 18px", borderRadius: "8px", textDecoration: "none",
            boxShadow: `0 4px 16px ${T.accentGlow}`,
            flexShrink: 0,
            transition: "opacity 0.15s",
          }}>
            <Plus size={14} strokeWidth={2.5} />
            Add data
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ flex: 1, padding: "24px 28px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {kpis.length === 0 ? (
            <EmptyDashboard workspaceSlug={workspaceSlug} />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "14px",
            }}>
              {kpis.map((kpi) => (
                <KpiTile key={kpi.id} kpi={kpi} workspaceSlug={workspaceSlug} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
