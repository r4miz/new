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
  const schema = `"${workspace.schema_name}"."${dataset.table_name}"`

  let proposed: ProposedKpi[]

  if (MOCK_AI) {
    const dateCol   = columns.find((c) => c.sql_type === "DATE" || c.sql_type === "TIMESTAMPTZ" || c.name.includes("date"))
    const numCols   = columns.filter((c) => c.sql_type === "NUMERIC")
    const revenueCol = numCols.find((c) => c.name.includes("revenue") || c.name.includes("amount")) ?? numCols[0]
    const expenseCol = numCols.find((c) => c.name.includes("expense") || c.name.includes("cost"))
    const textCols  = columns.filter((c) => c.sql_type === "TEXT")
    const regionCol = textCols.find((c) => c.name.includes("region") || c.name.includes("area") || c.name.includes("location"))
    const catCol    = textCols.find((c) => c.name.includes("type") || c.name.includes("category") || c.name.includes("project"))
    const agentCol  = textCols.find((c) => c.name.includes("consultant") || c.name.includes("rep") || c.name.includes("agent") || c.name.includes("name"))

    const d = dateCol?.name ?? "date"
    const r = revenueCol?.name ?? "revenue"
    const e = expenseCol?.name
    const reg = regionCol?.name ?? textCols[0]?.name ?? "region"
    const cat = catCol?.name ?? textCols[1]?.name ?? "project_type"
    const ag  = agentCol?.name ?? textCols[2]?.name ?? "consultant"

    proposed = [
      {
        name: "Monthly Revenue Trend",
        description: "Total revenue grouped by month — the single most important view of whether your business is growing, flat, or declining.",
        proposed_sql: `SELECT date_trunc('month', "${d}")::date AS month, SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema} GROUP BY 1 ORDER BY 1`,
        chart_type: "line",
      },
      {
        name: "Total Revenue",
        description: "Cumulative revenue across the entire dataset — your headline number.",
        proposed_sql: `SELECT SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema}`,
        chart_type: "number",
      },
      e ? {
        name: "Monthly Net Profit",
        description: "Revenue minus expenses by month — shows whether margins are expanding or contracting over time.",
        proposed_sql: `SELECT date_trunc('month', "${d}")::date AS month, SUM(COALESCE("${r}", 0)) - SUM(COALESCE("${e}", 0)) AS net_profit FROM ${schema} GROUP BY 1 ORDER BY 1`,
        chart_type: "area",
      } : {
        name: "Average Monthly Revenue",
        description: "Mean monthly revenue — smooths out spikes to show your typical run rate.",
        proposed_sql: `SELECT date_trunc('month', "${d}")::date AS month, AVG(COALESCE("${r}", 0)) AS avg_revenue FROM ${schema} GROUP BY 1 ORDER BY 1`,
        chart_type: "area",
      },
      {
        name: "Revenue by Region",
        description: "Total revenue broken down by region — identifies your strongest and weakest markets.",
        proposed_sql: `SELECT "${reg}" AS region, SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema} GROUP BY 1 ORDER BY 2 DESC`,
        chart_type: "bar",
      },
      {
        name: `Revenue by ${cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        description: `Revenue split by ${cat.replace(/_/g, " ")} — shows which categories or segments drive the most value.`,
        proposed_sql: `SELECT "${cat}" AS category, SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema} GROUP BY 1 ORDER BY 2 DESC`,
        chart_type: "bar",
      },
    ]
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
        { model: "claude-sonnet-4-6", endpoint: "propose-kpis", workspaceId: workspace_id, maxTokens: 4096 }
      )
    } catch (e) {
      return NextResponse.json({ error: `[propose-claude] ${e}` }, { status: 500 })
    }

    try {
      proposed = JSON.parse(rawResponse)
      if (!Array.isArray(proposed)) proposed = [proposed]
    } catch {
      return NextResponse.json({ error: `[propose-json] raw=${rawResponse.slice(0, 200)}` }, { status: 500 })
    }
  }

  const rows = proposed.map((p) => ({
    workspace_id,
    dataset_id,
    name: p.name,
    description: p.description,
    proposed_sql: p.proposed_sql,
    chart_type: p.chart_type ?? "bar",
  }))

  const { data: kpis, error: kpiErr } = await adminClient
    .from("kpi_proposals")
    .insert(rows)
    .select()
  if (kpiErr) return NextResponse.json({ error: `[propose-kpi-insert] ${kpiErr.message}` }, { status: 500 })

  return NextResponse.json({ kpis })
}
