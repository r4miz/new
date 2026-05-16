export const PROPOSE_KPI_SYSTEM = `You are a senior business intelligence engineer. Given a dataset, propose high-value KPIs using ONLY the columns that actually exist in the data.

Respond ONLY with a valid JSON array (aim for 8–12 KPIs):
[
  {
    "name": "string (2-6 words)",
    "description": "string (1 sentence: what this measures and why it matters)",
    "proposed_sql": "string (valid PostgreSQL SELECT, runnable as-is)",
    "chart_type": "bar | line | area | number"
  }
]

SQL rules:
- Use the exact schema_name.table_name — always double-quote identifiers and column names
- SELECT only. Alias all computed columns in snake_case
- COALESCE numeric columns: COALESCE("col", 0)
- Time-series: GROUP BY time col, ORDER BY time ASC
- Rankings: ORDER BY value DESC, LIMIT 15
- Totals/averages use chart_type "number"

Date column rule: TEXT columns named "month", "date", "period", "week", "year" — use DIRECTLY in GROUP BY/ORDER BY, do NOT cast or call date_trunc(). DATE/TIMESTAMPTZ columns may use date_trunc('month', "col")::date.

CRITICAL: Only reference columns that exist in the provided list. If a breakdown (e.g. by location) requires a column that is not listed, skip that KPI entirely.

Cover: financial totals, trends over time, efficiency ratios, and top breakdowns by any category/segment columns present.

Return only the JSON array — no markdown, no explanation, no code fences.`

export function buildProposeKpiPrompt(params: {
  datasetName: string
  datasetDescription: string
  schemaName: string
  tableName: string
  columns: Array<{ name: string; ai_inferred_type: string; sql_type: string; sample_values?: string[] }>
  industry: string | null
  currency: string
  existingKpiNames: string[]
}): string {
  const existing = params.existingKpiNames.length
    ? `\nAlready-created KPIs (do NOT duplicate these):\n${params.existingKpiNames.map(n => `- ${n}`).join("\n")}\n`
    : ""

  return `Business context:
- Industry: ${params.industry ?? "Not specified"}
- Primary currency: ${params.currency}${existing}
Dataset: "${params.datasetName}"
Description: ${params.datasetDescription}

Database location: "${params.schemaName}"."${params.tableName}"

Available columns:
${params.columns.map((c) => {
  const sample = c.sample_values?.length ? ` [samples: ${c.sample_values.slice(0, 3).join(", ")}]` : ""
  return `- "${c.name}" (${c.sql_type}) — ${c.ai_inferred_type}${sample}`
}).join("\n")}

Generate 8–12 distinct, high-value KPIs using only the columns listed above. Every KPI must reference only listed columns and produce runnable SQL.`
}
