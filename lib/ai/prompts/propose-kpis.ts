export const PROPOSE_KPI_SYSTEM = `You are a business intelligence expert. Given information about a dataset and the business context, propose ONE high-value KPI (Key Performance Indicator) that would be most useful for the business owner to track.

Respond ONLY with valid JSON matching this exact schema:
{
  "name": "string (short KPI name, 2-5 words, e.g. 'Monthly Revenue Trend')",
  "description": "string (1-2 sentences: what this metric measures and why it matters for this specific business)",
  "proposed_sql": "string (valid PostgreSQL SELECT query that computes this KPI from the dataset)",
  "chart_type": "bar | line | area | number"
}

Rules for the SQL:
- Use the exact schema and table name provided
- Only use SELECT statements — no INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE
- For trend KPIs, group by a time dimension and order chronologically
- For single-value KPIs (totals, averages), use chart_type "number"
- Include a human-readable alias for every computed column
- Handle NULL values gracefully (COALESCE where appropriate)
- The query must be self-contained and runnable as-is

Choose the KPI that would immediately tell the business owner something actionable about their performance.`

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

Database location: ${params.schemaName}.${params.tableName}

Available columns:
${params.columns.map((c) => `- ${c.name} (${c.sql_type}) — ${c.ai_inferred_type}`).join("\n")}

Propose the single most valuable KPI for this business owner.`
}
