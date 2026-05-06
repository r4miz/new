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
    <div style={{ minHeight: "100%", background: "#f1f5f9" }}>
      {/* Page header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "28px 36px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Add data
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#6b7280" }}>
          Upload a CSV and our AI will analyze your data and generate a full KPI dashboard.
        </p>
      </div>

      <div style={{ padding: "36px", maxWidth: "560px" }}>
        <UploadFlow workspace={workspace} />
      </div>
    </div>
  )
}
