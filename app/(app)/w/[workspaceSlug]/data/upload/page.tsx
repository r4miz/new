import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { UploadFlow } from "@/components/data/UploadFlow"

export default async function UploadPage({
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
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
            Add data
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#64748b" }}>
            Upload a CSV and AI will analyze your data and generate a full KPI dashboard.
          </p>
        </div>
      </div>
      <div style={{ padding: "24px 28px", maxWidth: "640px", margin: "0 auto" }}>
        <UploadFlow workspace={workspace} />
      </div>
    </div>
  )
}
