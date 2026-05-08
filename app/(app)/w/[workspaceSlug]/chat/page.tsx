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
    .from("datasets").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false })

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#060d1a" }}>
      <div style={{ background: "#0b1629", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>AI Advisor</h1>
        <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
          {workspace.industry ? `Expert in ${workspace.industry} · powered by your data` : "Business advisor · powered by your data"}
        </p>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ChatInterface workspace={workspace} datasets={(datasets ?? []) as Dataset[]} />
      </div>
    </div>
  )
}
