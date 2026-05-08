import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm"
import Link from "next/link"
import { CreditCard, ArrowRight } from "lucide-react"

const card: React.CSSProperties = {
  background: "#0b1629", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px", padding: "28px",
}

export default async function SettingsPage({
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

  return (
    <div style={{ minHeight: "100%", background: "#060d1a" }}>
      <div style={{ background: "#0b1629", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>Settings</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#64748b" }}>Manage your workspace preferences.</p>
        </div>
      </div>
      <div style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={card}>
            <h2 style={{ margin: "0 0 24px", fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>Workspace</h2>
            <WorkspaceSettingsForm workspace={workspace} />
          </div>
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>Other</h2>
            <Link href={`/w/${workspaceSlug}/settings/billing`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none",
              background: "#0f1e38",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={16} color="#0ea5e9" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>Billing &amp; subscription</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Manage your plan, invoices, and payment</p>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
