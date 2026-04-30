export const PROPOSE_KPI_SYSTEM = `You are a senior business intelligence engineer. Given a dataset and business context, propose exactly 5 high-value KPIs that together give the business owner a complete picture of performance.

Respond ONLY with a valid JSON array of exactly 5 objects:
[
  {
    "name": "string (2-5 words, e.g. 'Monthly Revenue Trend')",
    "description": "string (1-2 sentences: what this measures and why it matters)",
    "proposed_sql": "string (valid PostgreSQL SELECT, runnable as-is)",
    "chart_type": "bar | line | area | number"
  }
]

Rules:
- Mix chart types: include at least one "number" (single aggregate), one "line" or "area" (time series), one "bar" (category breakdown)
- Use the exact schema_name.table_name provided — always double-quote both identifiers
- SELECT only — no INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
- Time-series KPIs: GROUP BY time dimension, ORDER BY time ASC
- Ranking KPIs: ORDER BY value DESC, LIMIT 10
- All computed columns must have human-readable aliases
- Use COALESCE to handle NULLs in numeric columns
- Single-value KPIs (totals, averages, counts) use chart_type "number"
- The 5 KPIs should cover different angles: trend over time, total, breakdown by category, efficiency/ratio, and one unique insight

Return only the JSON array — no markdown, no explanation.`

export function buildProposeKpiPrompt(params: {
  datasetName: string
  datasetDescription: string
  schemaName: string
  tableName: string
  columns: Array<{ name: string; ai_inferred_type: string; sql_type: string }>
  industry: string | null
  currency: string
}): string {
  return `Business context:
- Industry: ${params.industry ?? "Not specified"}
- Primary currency: ${params.currency}

Dataset: "${params.datasetName}"
Description: ${params.datasetDescription}

Database location: "${params.schemaName}"."${params.tableName}"

Available columns:
${params.columns.map((c) => `- ${c.name} (${c.sql_type}) — ${c.ai_inferred_type}`).join("\n")}

Propose 5 KPIs that together give this business owner a complete performance overview.`
}
