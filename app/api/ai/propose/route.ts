import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { callClaude } from "@/lib/ai/client"
import { PROPOSE_KPI_SYSTEM, buildProposeKpiPrompt } from "@/lib/ai/prompts/propose-kpis"
import type { ColumnMetadata, ProposedKpi } from "@/lib/types"

const MOCK_AI = process.env.MOCK_AI === "true"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: `[propose-auth] ${authErr?.message}` }, { status: 401 })
  }

  let body: { dataset_id?: string; workspace_id?: string }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: `[propose-body] ${e}` }, { status: 400 })
  }

  const { dataset_id, workspace_id } = body
  if (!dataset_id || !workspace_id) {
    return NextResponse.json({ error: `[propose-missing]` }, { status: 400 })
  }

  const { data: membership, error: memberErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (memberErr) return NextResponse.json({ error: `[propose-member-err] ${memberErr.message}` }, { status: 500 })
  if (!membership) return NextResponse.json({ error: `[propose-no-member]` }, { status: 403 })

  const [{ data: workspace, error: wsErr }, { data: dataset, error: dsErr }] = await Promise.all([
    adminClient.from("workspaces").select("schema_name, industry, primary_currency").eq("id", workspace_id).maybeSingle(),
    adminClient.from("datasets").select("*").eq("id", dataset_id).eq("workspace_id", workspace_id).maybeSingle(),
  ])

  if (wsErr) return NextResponse.json({ error: `[propose-ws-err] ${wsErr.message}` }, { status: 500 })
  if (dsErr) return NextResponse.json({ error: `[propose-ds-err] ${dsErr.message}` }, { status: 500 })
  if (!workspace) return NextResponse.json({ error: `[propose-ws-missing]` }, { status: 404 })
  if (!dataset) return NextResponse.json({ error: `[propose-ds-missing]` }, { status: 404 })
  if (!dataset.ai_description) return NextResponse.json({ error: `[propose-not-parsed]` }, { status: 400 })

  const columns = (dataset.column_metadata ?? []) as ColumnMetadata[]

  let proposed: ProposedKpi

  if (MOCK_AI) {
    // Mock KPI for testing — uses the actual table/schema name so SQL is realistic
    const dateCol = columns.find((c) => c.sql_type === "DATE" || c.ai_inferred_type?.includes("date"))
    const revenueCol = columns.find((c) => c.ai_inferred_type?.includes("revenue") || c.ai_inferred_type?.includes("amount") || c.sql_type === "NUMERIC")
    proposed = {
      name: "Monthly Revenue Trend",
      description: "Total revenue grouped by month — the single most important metric for understanding whether your business is growing, flat, or declining.",
      proposed_sql: `SELECT
  date_trunc('month', "${dateCol?.name ?? "date"}")::date AS month,
  SUM("${revenueCol?.name ?? "revenue"}") AS total_revenue
FROM "${workspace.schema_name}"."${dataset.table_name}"
GROUP BY 1
ORDER BY 1`,
      chart_type: "line",
    }
  } else {
    let rawResponse: string
    try {
      rawResponse = await callClaude(
        PROPOSE_KPI_SYSTEM,
        buildProposeKpiPrompt({
          datasetName: dataset.name,
          datasetDescription: dataset.ai_description,
          schemaName: workspace.schema_name,
          tableName: dataset.table_name,
          columns,
          industry: workspace.industry,
          currency: workspace.primary_currency,
        }),
        { model: "claude-3-5-sonnet-20241022", endpoint: "propose-kpis", workspaceId: workspace_id, maxTokens: 1024 }
      )
    } catch (e) {
      return NextResponse.json({ error: `[propose-claude] ${e}` }, { status: 500 })
    }

    try {
      proposed = JSON.parse(rawResponse)
    } catch {
      return NextResponse.json({ error: `[propose-json] raw=${rawResponse.slice(0, 200)}` }, { status: 500 })
    }
  }

  const { data: kpi, error: kpiErr } = await adminClient
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
  if (kpiErr) return NextResponse.json({ error: `[propose-kpi-insert] ${kpiErr.message}` }, { status: 500 })

  return NextResponse.json({ kpi })
}
