import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { callClaude } from "@/lib/ai/client"
import {
  PARSE_DATASET_SYSTEM,
  buildParseDatasetPrompt,
} from "@/lib/ai/prompts/parse-dataset"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { dataset_id, workspace_id } = await request.json()
  if (!dataset_id || !workspace_id) {
    return NextResponse.json({ error: "Missing dataset_id or workspace_id" }, { status: 400 })
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Fetch dataset metadata
  const { data: dataset } = await adminClient
    .from("datasets")
    .select("*")
    .eq("id", dataset_id)
    .eq("workspace_id", workspace_id)
    .single()
  if (!dataset) return NextResponse.json({ error: "Dataset not found" }, { status: 404 })

  const columns = dataset.column_metadata as Array<{
    name: string
    original_name: string
    sql_type: string
    sample_values: string[]
  }>

  const headers = columns.map((c) => c.original_name)
  // Build sample rows from column metadata
  const sampleRows: Record<string, string>[] = []
  const sampleCount = columns[0]?.sample_values?.length ?? 0
  for (let i = 0; i < sampleCount; i++) {
    const row: Record<string, string> = {}
    columns.forEach((c) => {
      row[c.original_name] = c.sample_values[i] ?? ""
    })
    sampleRows.push(row)
  }

  const userMessage = buildParseDatasetPrompt(
    dataset.original_filename ?? dataset.name,
    headers,
    sampleRows
  )

  const rawResponse = await callClaude(PARSE_DATASET_SYSTEM, userMessage, {
    model: "claude-haiku-4-5",
    endpoint: "parse-dataset",
    workspaceId: workspace_id,
    maxTokens: 1024,
  })

  let aiResult: { columns: Array<{ original_name: string; ai_inferred_type: string; sql_type: string }>; description: string }
  try {
    aiResult = JSON.parse(rawResponse)
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: rawResponse }, { status: 500 })
  }

  // Merge AI inferences back into column metadata
  const updatedColumns = columns.map((col) => {
    const aiCol = aiResult.columns.find((a) => a.original_name === col.original_name)
    return {
      ...col,
      ai_inferred_type: aiCol?.ai_inferred_type ?? col.name,
      // Trust AI's sql_type if it differs (AI sees semantic meaning)
      sql_type: aiCol?.sql_type ?? col.sql_type,
    }
  })

  // Update dataset with AI results
  const { data: updated } = await adminClient
    .from("datasets")
    .update({
      column_metadata: updatedColumns,
      ai_description: aiResult.description,
    })
    .eq("id", dataset_id)
    .select()
    .single()

  return NextResponse.json({ dataset: updated })
}
