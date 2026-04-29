import { createClient } from "@/lib/supabase/server"
import type { Dataset } from "@/lib/types"

export async function getDatasets(workspaceId: string): Promise<Dataset[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("datasets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
  return (data as Dataset[]) ?? []
}

export async function getDataset(id: string): Promise<Dataset | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", id)
    .single()
  return data as Dataset | null
}
