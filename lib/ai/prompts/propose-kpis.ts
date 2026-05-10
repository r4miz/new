export const PROPOSE_KPI_SYSTEM = `You are a senior business intelligence engineer. Given a dataset, propose a comprehensive set of high-value KPIs that give the business owner a complete picture of performance across every meaningful angle.

Respond ONLY with a valid JSON array of objects (aim for 15–25 KPIs, cover every useful metric):
[
  {
    "name": "string (2-6 words, e.g. 'Monthly Revenue Trend')",
    "description": "string (1-2 sentences: what this measures and why it matters)",
    "proposed_sql": "string (valid PostgreSQL SELECT, runnable as-is)",
    "chart_type": "bar | line | area | number"
  }
]

SQL Rules:
- Use the exact schema_name.table_name provided — always double-quote both identifiers and column names
- SELECT only — no INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
- All computed columns must have human-readable snake_case aliases
- Use COALESCE to handle NULLs in numeric columns: COALESCE("col", 0)
- Time-series KPIs: GROUP BY time dimension, ORDER BY time ASC
- Ranking/breakdown KPIs: ORDER BY value DESC, LIMIT 15
- Single-value KPIs (totals, averages, counts) use chart_type "number"

CRITICAL — Date column handling:
- If a column has sql_type TEXT but its name suggests a date (e.g. "month", "date", "period", "year", "week") and values look like "2025-01" or "2025-01-01", use it DIRECTLY in GROUP BY and ORDER BY — do NOT call date_trunc() or cast it
- Example for a TEXT "month" column: SELECT "month", SUM("revenue") AS revenue FROM "schema"."table" GROUP BY "month" ORDER BY "month"
- If a column is DATE or TIMESTAMPTZ, you may use date_trunc('month', "col")::date

Coverage requirements — include KPIs from ALL of these categories that apply to the data:
1. FINANCIAL: totals, revenue/collections, margins, net income, cost breakdowns
2. TRENDS: month-over-month or period-over-period for key metrics
3. BREAKDOWN: performance by location, region, category, segment, or team
4. EFFICIENCY: ratios and percentages (overhead %, cost as % of revenue, margins)
5. CUSTOMERS/PATIENTS: counts, retention, acquisition, satisfaction, value
6. STAFF/EMPLOYEES: production per person, efficiency, performance ranking
7. PROJECTIONS: run-rate or annualized figures from available data
8. GROWTH: new vs existing, growth rates, best vs worst performers
9. OPERATIONAL: utilization rates, cancellations, no-shows, conversion rates

Mix chart types: numbers for single metrics, area/line for trends, bar for rankings and breakdowns.
Do NOT repeat the same KPI with a different name — every KPI should measure something distinct.

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

Generate a comprehensive set of 15–25 distinct KPIs covering financials, trends, breakdowns, efficiency, staff, and growth. Every KPI must be unique and query runnable SQL.`
}
