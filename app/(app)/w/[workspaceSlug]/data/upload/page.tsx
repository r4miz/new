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
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add data</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a CSV and our AI will analyze it and propose a KPI for your dashboard.
        </p>
      </div>
      <UploadFlow workspace={workspace} />
    </div>
  )
}
