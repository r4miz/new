import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm"
import Link from "next/link"
import { CreditCard, ArrowRight } from "lucide-react"

const cardStyle = {
  background: "white", border: "1px solid #e5e7eb",
  borderRadius: "12px", padding: "28px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
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
    <div style={{ minHeight: "100%", background: "#f1f5f9" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "28px 36px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Settings</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#6b7280" }}>Manage your workspace preferences.</p>
        </div>
      </div>

      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 24px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Workspace
            </h2>
            <WorkspaceSettingsForm workspace={workspace} />
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Other
            </h2>
            <Link
              href={`/w/${workspaceSlug}/settings/billing`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: "10px",
                border: "1px solid #e5e7eb", textDecoration: "none",
                background: "#f8fafc", transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={16} color="#2563eb" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Billing &amp; subscription</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Manage your plan, invoices, and payment method</p>
                </div>
              </div>
              <ArrowRight size={16} color="#9ca3af" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
