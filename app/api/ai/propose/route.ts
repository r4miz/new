import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { callClaude } from "@/lib/ai/client"
import {
  PROPOSE_KPI_SYSTEM,
  buildProposeKpiPrompt,
} from "@/lib/ai/prompts/propose-kpis"
import type { ColumnMetadata, ProposedKpi } from "@/lib/types"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { dataset_id, workspace_id } = await request.json()

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Fetch workspace + dataset
  const [{ data: workspace }, { data: dataset }] = await Promise.all([
    adminClient.from("workspaces").select("schema_name, industry, primary_currency").eq("id", workspace_id).single(),
    adminClient.from("datasets").select("*").eq("id", dataset_id).eq("workspace_id", workspace_id).single(),
  ])

  if (!workspace || !dataset) {
    return NextResponse.json({ error: "Workspace or dataset not found" }, { status: 404 })
  }

  if (!dataset.ai_description) {
    return NextResponse.json(
      { error: "Dataset must be parsed by AI before proposing KPIs" },
      { status: 400 }
    )
  }

  const columns = dataset.column_metadata as ColumnMetadata[]

  const userMessage = buildProposeKpiPrompt({
    datasetName: dataset.name,
    datasetDescription: dataset.ai_description,
    schemaName: workspace.schema_name,
    tableName: dataset.table_name,
    columns,
    industry: workspace.industry,
    currency: workspace.primary_currency,
  })

  const rawResponse = await callClaude(PROPOSE_KPI_SYSTEM, userMessage, {
    endpoint: "propose-kpis",
    workspaceId: workspace_id,
    maxTokens: 1024,
  })

  let proposed: ProposedKpi
  try {
    proposed = JSON.parse(rawResponse)
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: rawResponse }, { status: 500 })
  }

  // Save the proposal
  const { data: kpi } = await adminClient
    .from("kpi_proposals")
    .insert({
      workspace_id,
      dataset_id,
      name: proposed.name,
      description: proposed.description,
      proposed_sql: proposed.proposed_sql,
      chart_type: proposed.chart_type ?? "bar",
    })
    .select()
    .single()

  return NextResponse.json({ kpi })
}
