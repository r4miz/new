import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { ChatInterface } from "@/components/chat/ChatInterface"
import type { Dataset } from "@/lib/types"
import { T } from "@/lib/theme"

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

  const [{ data: datasets }, { data: sessions }] = await Promise.all([
    adminClient.from("datasets").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    adminClient.from("chat_sessions")
      .select("id, title, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40),
  ])

  return (
    <div style={{ display: "flex", height: "100%", background: T.bg }}>
      <ChatInterface
        workspace={workspace}
        datasets={(datasets ?? []) as Dataset[]}
        userId={user.id}
        initialSessions={(sessions ?? []) as Array<{ id: string; title: string; updated_at: string }>}
      />
    </div>
  )
}
