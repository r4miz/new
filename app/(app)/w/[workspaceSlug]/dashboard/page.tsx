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

  const [kpis, { count: dsCount }, { count: intCount }] = await Promise.all([
    getKpiProposals(workspace.id),
    adminClient.from("datasets").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    adminClient.from("integrations").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "active"),
  ])

  const stats = [
    { label: "KPIs tracked",        value: kpis.length,   icon: TrendingUp },
    { label: "Datasets",            value: dsCount ?? 0,  icon: Database   },
    { label: "Live integrations",   value: intCount ?? 0, icon: Plug       },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Dark hero header */}
      <div style={{
        background: "linear-gradient(135deg, #0b0d14 0%, #0f172a 60%, #1e1b4b 100%)",
        padding: "32px 32px 0",
        flexShrink: 0,
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              {workspace.industry
                ? `AI insights for ${workspace.industry} · ${workspace.name}`
                : `AI-powered analytics · ${workspace.name}`}
            </p>
          </div>
          <Link
            href={`/w/${workspaceSlug}/data/upload`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "white", fontSize: "13px", fontWeight: 600,
              padding: "9px 16px", borderRadius: "10px", textDecoration: "none",
              boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
            }}
          >
            <Plus size={14} />
            Add data
          </Link>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: "1px", marginBottom: "-1px" }}>
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.label} style={{
                flex: 1, padding: "16px 20px",
                background: "rgba(255,255,255,0.04)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={15} color="#94a3b8" />
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>
                    {s.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {kpis.length === 0 ? (
          <EmptyDashboard workspaceSlug={workspaceSlug} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
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
