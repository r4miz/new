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
    <div style={{ minHeight: "100%", background: "#07090e" }}>
      <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 36px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            Add data
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#475569" }}>
            Upload a CSV and AI will analyze your data and generate a full KPI dashboard.
          </p>
        </div>
      </div>
      <div style={{ padding: "36px", maxWidth: "640px", margin: "0 auto" }}>
        <UploadFlow workspace={workspace} />
      </div>
    </div>
  )
}
