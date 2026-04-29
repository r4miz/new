import { createClient } from "@/lib/supabase/server"
import type { Workspace } from "@/lib/types"

export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .single()
  return data as Workspace | null
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspaces")
    .select("*, workspace_members!inner(user_id)")
    .eq("workspace_members.user_id", userId)
    .order("created_at", { ascending: false })
  return (data as Workspace[]) ?? []
}

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single()
  return data
}
