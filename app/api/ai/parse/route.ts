import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { callClaude } from "@/lib/ai/client"
import {
  PARSE_DATASET_SYSTEM,
  buildParseDatasetPrompt,
} from "@/lib/ai/prompts/parse-dataset"

// Set MOCK_AI=true in Vercel env vars to bypass Anthropic while testing
const MOCK_AI = process.env.MOCK_AI === "true"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: `[parse-auth] ${authErr?.message}` }, { status: 401 })
  }

  let body: { dataset_id?: string; workspace_id?: string }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: `[parse-body] ${e}` }, { status: 400 })
  }

  const { dataset_id, workspace_id } = body
  if (!dataset_id || !workspace_id) {
    return NextResponse.json({ error: `[parse-missing]` }, { status: 400 })
  }

  const { data: membership, error: memberErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (memberErr) return NextResponse.json({ error: `[parse-member-err] ${memberErr.message}` }, { status: 500 })
  if (!membership) return NextResponse.json({ error: `[parse-no-member]` }, { status: 403 })

  const { data: dataset, error: dsErr } = await adminClient
    .from("datasets")
    .select("*")
    .eq("id", dataset_id)
    .eq("workspace_id", workspace_id)
    .maybeSingle()
  if (dsErr) return NextResponse.json({ error: `[parse-dataset-err] ${dsErr.message}` }, { status: 500 })
  if (!dataset) return NextResponse.json({ error: `[parse-dataset-missing]` }, { status: 404 })

  const columns = (dataset.column_metadata ?? []) as Array<{
    name: string; original_name: string; sql_type: string; sample_values: string[]
  }>

  let aiResult: { columns: Array<{ original_name: string; ai_inferred_type: string }>; description: string }

  if (MOCK_AI) {
    // Mock response for testing without Anthropic credits
    aiResult = {
      columns: columns.map((c) => ({
        original_name: c.original_name,
        ai_inferred_type: c.name.includes("date") ? "transaction date"
          : c.name.includes("revenue") || c.name.includes("amount") ? "revenue amount in USD"
          : c.name.includes("client") || c.name.includes("name") ? "client or customer name"
          : c.name.includes("status") ? "status or category"
          : "business metric",
      })),
      description: `This dataset contains ${dataset.row_count ?? "multiple"} records of business data from ${dataset.original_filename ?? dataset.name}. It can be used to track performance trends, identify top contributors, and analyze business patterns over time.`,
    }
  } else {
    const headers = columns.map((c) => c.original_name)
    const sampleRows: Record<string, string>[] = []
    const sampleCount = columns[0]?.sample_values?.length ?? 0
    for (let i = 0; i < sampleCount; i++) {
      const row: Record<string, string> = {}
      columns.forEach((c) => { row[c.original_name] = c.sample_values[i] ?? "" })
      sampleRows.push(row)
    }

    let rawResponse: string
    try {
      rawResponse = await callClaude(
        PARSE_DATASET_SYSTEM,
        buildParseDatasetPrompt(dataset.original_filename ?? dataset.name, headers, sampleRows),
        { model: "claude-haiku-4-5-20251001", endpoint: "parse-dataset", workspaceId: workspace_id, maxTokens: 1024 }
      )
    } catch (e) {
      return NextResponse.json({ error: `[parse-claude] ${e}` }, { status: 500 })
    }

    try {
      aiResult = JSON.parse(rawResponse)
    } catch {
      return NextResponse.json({ error: `[parse-json] raw=${rawResponse.slice(0, 200)}` }, { status: 500 })
    }
  }

  const updatedColumns = columns.map((col) => {
    const aiCol = aiResult.columns.find((a) => a.original_name === col.original_name)
    return { ...col, ai_inferred_type: aiCol?.ai_inferred_type ?? col.name }
  })

  const { data: updated, error: updateErr } = await adminClient
    .from("datasets")
    .update({ column_metadata: updatedColumns, ai_description: aiResult.description })
    .eq("id", dataset_id)
    .select()
    .single()
  if (updateErr) return NextResponse.json({ error: `[parse-update] ${updateErr.message}` }, { status: 500 })

  return NextResponse.json({ dataset: updated })
}
