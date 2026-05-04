import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { ChatInterface } from "@/components/chat/ChatInterface"
import type { Dataset } from "@/lib/types"

export default async function ChatPage({
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

  const { data: datasets } = await adminClient
    .from("datasets")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-base font-semibold text-slate-900">AI Advisor</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {workspace.industry
            ? `Expert in ${workspace.industry} · powered by your data`
            : "Business advisor · powered by your data"}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface workspace={workspace} datasets={(datasets ?? []) as Dataset[]} />
      </div>
    </div>
  )
}
