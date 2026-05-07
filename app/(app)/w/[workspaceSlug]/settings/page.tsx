import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm"
import Link from "next/link"
import { CreditCard, ArrowRight } from "lucide-react"

const card: React.CSSProperties = {
  background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
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
    <div style={{ minHeight: "100%", background: "#07090e" }}>
      <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 36px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>Settings</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#475569" }}>Manage your workspace preferences.</p>
        </div>
      </div>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={card}>
            <h2 style={{ margin: "0 0 24px", fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>Workspace</h2>
            <WorkspaceSettingsForm workspace={workspace} />
          </div>
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>Other</h2>
            <Link href={`/w/${workspaceSlug}/settings/billing`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none",
              background: "#141d2e",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={16} color="#0ea5e9" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>Billing &amp; subscription</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>Manage your plan, invoices, and payment</p>
                </div>
              </div>
              <ArrowRight size={16} color="#334155" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
