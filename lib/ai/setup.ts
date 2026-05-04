import { adminClient } from "@/lib/supabase/admin"
import { callClaude } from "@/lib/ai/client"
import { PARSE_DATASET_SYSTEM, buildParseDatasetPrompt } from "@/lib/ai/prompts/parse-dataset"
import { PROPOSE_KPI_SYSTEM, buildProposeKpiPrompt } from "@/lib/ai/prompts/propose-kpis"
import type { ColumnMetadata } from "@/lib/types"

const MOCK_AI = process.env.MOCK_AI === "true"

/**
 * Runs AI parse + KPI proposal for a dataset that was just created.
 * Called by both the manual upload flow and integration sync engine.
 */
export async function setupDatasetAI(datasetId: string, workspaceId: string): Promise<void> {
  const [{ data: dataset }, { data: workspace }] = await Promise.all([
    adminClient.from("datasets").select("*").eq("id", datasetId).single(),
    adminClient.from("workspaces").select("schema_name, industry, primary_currency, name").eq("id", workspaceId).single(),
  ])
  if (!dataset || !workspace) throw new Error("Dataset or workspace not found")

  const columns = (dataset.column_metadata ?? []) as ColumnMetadata[]

  // ── Step 1: AI parse ───────────────────────────────────────────────────────
  let updatedColumns: ColumnMetadata[]
  let aiDescription: string

  if (MOCK_AI) {
    updatedColumns = columns.map((c) => ({
      ...c,
      ai_inferred_type: c.name.includes("date") ? "transaction date"
        : c.name.includes("revenue") || c.name.includes("amount") || c.name.includes("price") || c.name.includes("total") ? "revenue amount in USD"
        : c.name.includes("client") || c.name.includes("customer") || c.name.includes("name") ? "client or customer name"
        : c.name.includes("status") ? "status or category"
        : "business metric",
    }))
    aiDescription = `This dataset contains ${dataset.row_count ?? "multiple"} records from ${dataset.original_filename ?? dataset.name}.`
  } else {
    const headers = columns.map((c) => c.original_name)
    const sampleRows: Record<string, string>[] = []
    const sampleCount = columns[0]?.sample_values?.length ?? 0
    for (let i = 0; i < sampleCount; i++) {
      const row: Record<string, string> = {}
      columns.forEach((c) => { row[c.original_name] = c.sample_values[i] ?? "" })
      sampleRows.push(row)
    }

    const parseRaw = await callClaude(
      PARSE_DATASET_SYSTEM,
      buildParseDatasetPrompt(dataset.original_filename ?? dataset.name, headers, sampleRows),
      { model: "claude-haiku-4-5-20251001", endpoint: "parse-dataset", workspaceId, maxTokens: 1024 }
    )
    const parsed = JSON.parse(parseRaw) as { columns: Array<{ original_name: string; ai_inferred_type: string }>; description: string }
    updatedColumns = columns.map((col) => ({
      ...col,
      ai_inferred_type: parsed.columns.find((a) => a.original_name === col.original_name)?.ai_inferred_type ?? col.name,
    }))
    aiDescription = parsed.description
  }

  await adminClient.from("datasets").update({
    column_metadata: updatedColumns,
    ai_description: aiDescription,
  }).eq("id", datasetId)

  // ── Step 2: AI propose KPIs ────────────────────────────────────────────────
  const schema = `"${workspace.schema_name}"."${dataset.table_name}"`

  let proposed: Array<{ name: string; description: string; proposed_sql: string; chart_type: string }>

  if (MOCK_AI) {
    const dateCol    = updatedColumns.find((c) => c.sql_type === "DATE" || c.sql_type === "TIMESTAMPTZ")
    const revenueCol = updatedColumns.find((c) => c.name.includes("revenue") || c.name.includes("total") || c.name.includes("price") || c.sql_type === "NUMERIC")
    const textCols   = updatedColumns.filter((c) => c.sql_type === "TEXT")
    const d = dateCol?.name ?? "date"
    const r = revenueCol?.name ?? "revenue"
    const cat = textCols[0]?.name ?? "category"

    proposed = [
      { name: "Revenue Over Time", description: "Total revenue grouped by month.", proposed_sql: `SELECT date_trunc('month', "${d}")::date AS month, SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema} GROUP BY 1 ORDER BY 1`, chart_type: "line" },
      { name: "Total Revenue", description: "Cumulative revenue across all records.", proposed_sql: `SELECT SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema}`, chart_type: "number" },
      { name: `Revenue by ${cat}`, description: `Revenue broken down by ${cat}.`, proposed_sql: `SELECT "${cat}" AS category, SUM(COALESCE("${r}", 0)) AS total_revenue FROM ${schema} GROUP BY 1 ORDER BY 2 DESC`, chart_type: "bar" },
    ]
  } else {
    const proposeRaw = await callClaude(
      PROPOSE_KPI_SYSTEM,
      buildProposeKpiPrompt({
        datasetName: dataset.name,
        datasetDescription: aiDescription,
        schemaName: workspace.schema_name,
        tableName: dataset.table_name,
        columns: updatedColumns,
        industry: workspace.industry,
        currency: workspace.primary_currency,
      }),
      { model: "claude-sonnet-4-6", endpoint: "propose-kpis", workspaceId, maxTokens: 4096 }
    )
    proposed = JSON.parse(proposeRaw)
    if (!Array.isArray(proposed)) proposed = [proposed]
  }

  await adminClient.from("kpi_proposals").insert(
    proposed.map((p) => ({
      workspace_id: workspaceId,
      dataset_id: datasetId,
      name: p.name,
      description: p.description,
      proposed_sql: p.proposed_sql,
      chart_type: p.chart_type ?? "bar",
    }))
  )
}
