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

  const [{ data: workspace, error: wsErr }, { data: dataset, error: dsErr }, { data: existingKpis }] = await Promise.all([
    adminClient.from("workspaces").select("schema_name, industry, primary_currency").eq("id", workspace_id).maybeSingle(),
    adminClient.from("datasets").select("*").eq("id", dataset_id).eq("workspace_id", workspace_id).maybeSingle(),
    adminClient.from("kpi_proposals").select("name").eq("workspace_id", workspace_id),
  ])

  if (wsErr) return NextResponse.json({ error: `[propose-ws-err] ${wsErr.message}` }, { status: 500 })
  if (dsErr) return NextResponse.json({ error: `[propose-ds-err] ${dsErr.message}` }, { status: 500 })
  if (!workspace) return NextResponse.json({ error: `[propose-ws-missing]` }, { status: 404 })
  if (!dataset) return NextResponse.json({ error: `[propose-ds-missing]` }, { status: 404 })
  if (!dataset.ai_description) return NextResponse.json({ error: `[propose-not-parsed]` }, { status: 400 })

  const columns = (dataset.column_metadata ?? []) as ColumnMetadata[]
  const schema  = `"${workspace.schema_name}"."${dataset.table_name}"`
  const existingNames = new Set((existingKpis ?? []).map((k: { name: string }) => k.name.toLowerCase()))

  let proposed: ProposedKpi[]

  if (MOCK_AI) {
    proposed = buildMockKpis(columns, schema, dataset.table_name)
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
          existingKpiNames: (existingKpis ?? []).map((k: { name: string }) => k.name),
        }),
        { model: "claude-sonnet-4-6", endpoint: "propose-kpis", workspaceId: workspace_id, maxTokens: 8192 }
      )
    } catch (e) {
      return NextResponse.json({ error: `[propose-claude] ${e}` }, { status: 500 })
    }

    try {
      const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      proposed = JSON.parse(cleaned)
      if (!Array.isArray(proposed)) proposed = [proposed]
    } catch {
      return NextResponse.json({ error: `[propose-json] raw=${rawResponse.slice(0, 200)}` }, { status: 500 })
    }
  }

  // Deduplicate against existing KPI names
  const unique = proposed.filter(p => !existingNames.has(p.name.toLowerCase()))

  if (unique.length === 0) {
    return NextResponse.json({ kpis: [] })
  }

  const rows = unique.map((p) => ({
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

// ─── Comprehensive mock KPI builder ──────────────────────────────────────────

function col(columns: ColumnMetadata[], ...hints: string[]): string | null {
  for (const hint of hints) {
    const found = columns.find(c =>
      c.name.includes(hint) || (c.ai_inferred_type ?? "").toLowerCase().includes(hint)
    )
    if (found) return found.name
  }
  return null
}

function numCols(columns: ColumnMetadata[]): ColumnMetadata[] {
  return columns.filter(c => c.sql_type === "NUMERIC")
}

function textCols(columns: ColumnMetadata[]): ColumnMetadata[] {
  return columns.filter(c => c.sql_type === "TEXT")
}

// Detect a "time" column — could be DATE, TIMESTAMPTZ, or TEXT that looks like a date
function timeCol(columns: ColumnMetadata[]): { name: string; isText: boolean } | null {
  // Real date/timestamp columns first
  const real = columns.find(c =>
    c.sql_type === "DATE" || c.sql_type === "TIMESTAMPTZ"
  )
  if (real) return { name: real.name, isText: false }

  // TEXT columns named like date fields
  const textDate = columns.find(c =>
    c.sql_type === "TEXT" &&
    /^(month|date|period|week|year|quarter|time)$/.test(c.name)
  )
  if (textDate) return { name: textDate.name, isText: true }

  return null
}

function timeSel(tc: { name: string; isText: boolean }): string {
  // For already-truncated TEXT columns (e.g. "2025-01"), use directly
  if (tc.isText) return `"${tc.name}"`
  return `date_trunc('month', "${tc.name}")::date AS "${tc.name}"`
}

function buildMockKpis(columns: ColumnMetadata[], schema: string, _tableName: string): ProposedKpi[] {
  const kpis: ProposedKpi[] = []
  const tc   = timeCol(columns)
  const nums = numCols(columns)
  const txts = textCols(columns)

  const revCol  = col(columns, "collection", "revenue", "amount", "income", "sales", "production")
  const netCol  = col(columns, "net_income", "profit", "net_collection", "net_revenue")
  const cntCol  = col(columns, "new_patient", "count", "customer", "patient")
  const catCol  = col(columns, "location", "region", "category", "type", "department")
  const provCol = col(columns, "provider", "agent", "rep", "name", "consultant", "employee")
  const roleCol = col(columns, "role", "position", "title")
  const ohCol   = col(columns, "overhead", "staff_overhead", "expense", "cost")
  const supCol  = col(columns, "supply", "supply_cost")
  const labCol  = col(columns, "lab", "lab_cost")
  const mktCol  = col(columns, "marketing", "marketing_spend", "ads")
  const rentCol = col(columns, "rent")
  const caseAcc = col(columns, "case_acceptance")
  const recCol  = col(columns, "recare", "retention", "reappointment")
  const satCol  = col(columns, "satisfaction", "score", "rating", "nps")
  const refCol  = col(columns, "referral")
  const canCol  = col(columns, "cancellation", "cancel")
  const noshCol = col(columns, "no_show")
  const daysCol = col(columns, "days_worked", "days")
  const otCol   = col(columns, "overtime")
  const hygCol  = col(columns, "hygiene")
  const drCol   = col(columns, "doctor")
  const treatVal = col(columns, "avg_treatment", "treatment_value", "value")
  const grossCol = col(columns, "gross_production", "gross")
  const adjCol   = col(columns, "adjustment", "adjustments")

  // ── FINANCIAL ──────────────────────────────────────────────────────────────

  if (revCol) {
    kpis.push({
      name: "Total Collections",
      description: "Sum of all collections across the entire dataset — your headline revenue number.",
      proposed_sql: `SELECT SUM(COALESCE("${revCol}", 0)) AS total_collections FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (netCol) {
    kpis.push({
      name: "Total Net Income",
      description: "Sum of all net income — the actual profit after all expenses.",
      proposed_sql: `SELECT SUM(COALESCE("${netCol}", 0)) AS total_net_income FROM ${schema}`,
      chart_type: "number",
    })

    kpis.push({
      name: "Average Monthly Net Income",
      description: "Mean net income per period — your typical profitability run-rate.",
      proposed_sql: `SELECT AVG(COALESCE("${netCol}", 0)) AS avg_net_income FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (grossCol && revCol) {
    kpis.push({
      name: "Collections Rate",
      description: "Percentage of gross production that was actually collected — a key measure of billing efficiency.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${revCol}", 0)) / NULLIF(SUM(COALESCE("${grossCol}", 0)), 0) * 100, 1) AS collections_rate_pct FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (ohCol && revCol) {
    kpis.push({
      name: "Overhead Rate",
      description: "Staff overhead as a percentage of collections — industry benchmark is under 60%.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${ohCol}", 0)) / NULLIF(SUM(COALESCE("${revCol}", 0)), 0) * 100, 1) AS overhead_pct FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (supCol && revCol) {
    kpis.push({
      name: "Supply Cost %",
      description: "Supply costs as a percentage of collections — benchmark is under 6%.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${supCol}", 0)) / NULLIF(SUM(COALESCE("${revCol}", 0)), 0) * 100, 1) AS supply_cost_pct FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (labCol && revCol) {
    kpis.push({
      name: "Lab Cost %",
      description: "Lab costs as a percentage of collections — benchmark is under 10%.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${labCol}", 0)) / NULLIF(SUM(COALESCE("${revCol}", 0)), 0) * 100, 1) AS lab_cost_pct FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (mktCol && cntCol) {
    kpis.push({
      name: "Cost Per New Patient",
      description: "Marketing spend divided by new patients acquired — measures acquisition efficiency.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${mktCol}", 0)) / NULLIF(SUM(COALESCE("${cntCol}", 0)), 0), 2) AS cost_per_new_patient FROM ${schema}`,
      chart_type: "number",
    })
  }

  // ── TRENDS ─────────────────────────────────────────────────────────────────

  if (tc && revCol) {
    const tSel = timeSel(tc)
    kpis.push({
      name: "Monthly Collections Trend",
      description: "Collections over time — the most important view of whether revenue is growing or declining.",
      proposed_sql: `SELECT ${tSel}, SUM(COALESCE("${revCol}", 0)) AS collections FROM ${schema} GROUP BY "${tc.name}" ORDER BY "${tc.name}"`,
      chart_type: "area",
    })
  }

  if (tc && netCol) {
    const tSel = timeSel(tc)
    kpis.push({
      name: "Monthly Net Income Trend",
      description: "Net income over time — shows whether margins are expanding or contracting.",
      proposed_sql: `SELECT ${tSel}, SUM(COALESCE("${netCol}", 0)) AS net_income FROM ${schema} GROUP BY "${tc.name}" ORDER BY "${tc.name}"`,
      chart_type: "area",
    })
  }

  if (tc && cntCol) {
    const tSel = timeSel(tc)
    kpis.push({
      name: "New Patient Growth Trend",
      description: "New patient or customer count over time — tracks acquisition momentum.",
      proposed_sql: `SELECT ${tSel}, SUM(COALESCE("${cntCol}", 0)) AS new_patients FROM ${schema} GROUP BY "${tc.name}" ORDER BY "${tc.name}"`,
      chart_type: "line",
    })
  }

  if (tc && mktCol) {
    const tSel = timeSel(tc)
    kpis.push({
      name: "Marketing Spend Trend",
      description: "Marketing investment over time — correlate with new patient growth to measure ROI.",
      proposed_sql: `SELECT ${tSel}, SUM(COALESCE("${mktCol}", 0)) AS marketing_spend FROM ${schema} GROUP BY "${tc.name}" ORDER BY "${tc.name}"`,
      chart_type: "line",
    })
  }

  // ── BREAKDOWN BY CATEGORY ──────────────────────────────────────────────────

  if (catCol && revCol) {
    kpis.push({
      name: `Revenue by ${catCol.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `Total collections broken down by ${catCol.replace(/_/g, " ")} — identifies top and bottom performers.`,
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${revCol}", 0)) AS collections FROM ${schema} GROUP BY "${catCol}" ORDER BY collections DESC`,
      chart_type: "bar",
    })
  }

  if (catCol && netCol) {
    kpis.push({
      name: `Net Income by ${catCol.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `Net profit broken down by ${catCol.replace(/_/g, " ")} — reveals which locations or segments are truly profitable.`,
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${netCol}", 0)) AS net_income FROM ${schema} GROUP BY "${catCol}" ORDER BY net_income DESC`,
      chart_type: "bar",
    })
  }

  if (catCol && cntCol) {
    kpis.push({
      name: `New Patients by ${catCol.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `New patient or customer count broken down by ${catCol.replace(/_/g, " ")} — shows where acquisition is strongest.`,
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${cntCol}", 0)) AS new_patients FROM ${schema} GROUP BY "${catCol}" ORDER BY new_patients DESC`,
      chart_type: "bar",
    })
  }

  if (catCol && ohCol) {
    kpis.push({
      name: `Overhead by ${catCol.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `Staff overhead costs broken down by ${catCol.replace(/_/g, " ")} — flags locations with bloated payroll.`,
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${ohCol}", 0)) AS staff_overhead FROM ${schema} GROUP BY "${catCol}" ORDER BY staff_overhead DESC`,
      chart_type: "bar",
    })
  }

  if (catCol && mktCol) {
    kpis.push({
      name: `Marketing Spend by ${catCol.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `Marketing investment by ${catCol.replace(/_/g, " ")} — compare against new patient counts per location to measure channel ROI.`,
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${mktCol}", 0)) AS marketing_spend FROM ${schema} GROUP BY "${catCol}" ORDER BY marketing_spend DESC`,
      chart_type: "bar",
    })
  }

  // ── STAFF / EMPLOYEE ───────────────────────────────────────────────────────

  if (provCol && revCol) {
    kpis.push({
      name: "Production per Provider",
      description: "Total revenue or production per provider — identifies your highest and lowest contributors.",
      proposed_sql: `SELECT "${provCol}", SUM(COALESCE("${revCol}", 0)) AS production FROM ${schema} GROUP BY "${provCol}" ORDER BY production DESC`,
      chart_type: "bar",
    })
  }

  if (provCol && daysCol && revCol) {
    kpis.push({
      name: "Production per Day Worked",
      description: "Revenue divided by days worked per provider — the fairest measure of provider efficiency.",
      proposed_sql: `SELECT "${provCol}", ROUND(SUM(COALESCE("${revCol}", 0)) / NULLIF(SUM(COALESCE("${daysCol}", 0)), 0), 2) AS production_per_day FROM ${schema} WHERE COALESCE("${daysCol}", 0) > 0 GROUP BY "${provCol}" ORDER BY production_per_day DESC`,
      chart_type: "bar",
    })
  }

  if (provCol && satCol) {
    kpis.push({
      name: "Provider Satisfaction Scores",
      description: "Patient satisfaction rating by provider — highlights service quality across the team.",
      proposed_sql: `SELECT "${provCol}", ROUND(AVG(COALESCE("${satCol}", 0)), 2) AS avg_satisfaction FROM ${schema} GROUP BY "${provCol}" ORDER BY avg_satisfaction DESC`,
      chart_type: "bar",
    })
  }

  if (provCol && otCol) {
    kpis.push({
      name: "Overtime Hours by Provider",
      description: "Total overtime hours per provider or location — a leading indicator of burnout and staffing gaps.",
      proposed_sql: `SELECT "${provCol}", SUM(COALESCE("${otCol}", 0)) AS overtime_hours FROM ${schema} GROUP BY "${provCol}" ORDER BY overtime_hours DESC`,
      chart_type: "bar",
    })
  }

  if (roleCol && revCol) {
    kpis.push({
      name: "Production by Role",
      description: "Revenue broken down by staff role — shows relative contribution of doctors vs hygienists vs others.",
      proposed_sql: `SELECT "${roleCol}", SUM(COALESCE("${revCol}", 0)) AS production FROM ${schema} GROUP BY "${roleCol}" ORDER BY production DESC`,
      chart_type: "bar",
    })
  }

  // ── PATIENT METRICS ────────────────────────────────────────────────────────

  if (caseAcc && catCol) {
    kpis.push({
      name: "Case Acceptance by Location",
      description: "Average case acceptance rate per location — benchmark is 85%+. Low rates indicate presentation issues.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${caseAcc}", 0)) * 100, 1) AS acceptance_pct FROM ${schema} GROUP BY "${catCol}" ORDER BY acceptance_pct DESC`,
      chart_type: "bar",
    })
  }

  if (recCol && catCol) {
    kpis.push({
      name: "Recare Rate by Location",
      description: "Hygiene reappointment rate per location — benchmark is 85%+. Low rates mean patients aren't returning for cleanings.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${recCol}", 0)) * 100, 1) AS recare_rate_pct FROM ${schema} GROUP BY "${catCol}" ORDER BY recare_rate_pct DESC`,
      chart_type: "bar",
    })
  }

  if (satCol && catCol) {
    kpis.push({
      name: "Patient Satisfaction by Location",
      description: "Average patient satisfaction score per location — drives referrals and online reviews.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${satCol}", 0)), 2) AS avg_satisfaction FROM ${schema} GROUP BY "${catCol}" ORDER BY avg_satisfaction DESC`,
      chart_type: "bar",
    })
  }

  if (refCol && catCol) {
    kpis.push({
      name: "Referral Rate by Location",
      description: "Percentage of patients who referred someone — the strongest signal of patient loyalty.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${refCol}", 0)) * 100, 1) AS referral_rate_pct FROM ${schema} GROUP BY "${catCol}" ORDER BY referral_rate_pct DESC`,
      chart_type: "bar",
    })
  }

  if (canCol && catCol) {
    kpis.push({
      name: "Cancellation Rate by Location",
      description: "Average cancellation rate per location — over 8% indicates scheduling or communication problems.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${canCol}", 0)) * 100, 1) AS cancellation_rate_pct FROM ${schema} GROUP BY "${catCol}" ORDER BY cancellation_rate_pct DESC`,
      chart_type: "bar",
    })
  }

  if (noshCol && catCol) {
    kpis.push({
      name: "No-Show Rate by Location",
      description: "Average no-show rate per location — each no-show is lost revenue and a wasted slot.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${noshCol}", 0)) * 100, 1) AS no_show_rate_pct FROM ${schema} GROUP BY "${catCol}" ORDER BY no_show_rate_pct DESC`,
      chart_type: "bar",
    })
  }

  if (treatVal && catCol) {
    kpis.push({
      name: "Avg Treatment Value by Location",
      description: "Average value of accepted treatment per location — higher means better case presentation.",
      proposed_sql: `SELECT "${catCol}", ROUND(AVG(COALESCE("${treatVal}", 0)), 2) AS avg_treatment_value FROM ${schema} GROUP BY "${catCol}" ORDER BY avg_treatment_value DESC`,
      chart_type: "bar",
    })
  }

  if (hygCol && drCol && catCol) {
    kpis.push({
      name: "Hygiene vs Doctor Production",
      description: "Hygiene and doctor production split by location — ideal is hygiene covering 30–35% of total.",
      proposed_sql: `SELECT "${catCol}", SUM(COALESCE("${hygCol}", 0)) AS hygiene_production, SUM(COALESCE("${drCol}", 0)) AS doctor_production FROM ${schema} GROUP BY "${catCol}" ORDER BY hygiene_production DESC`,
      chart_type: "bar",
    })
  }

  // ── PROJECTIONS ────────────────────────────────────────────────────────────

  if (revCol && tc) {
    kpis.push({
      name: "Annualized Revenue Run-Rate",
      description: "Latest month's collections × 12 — projects annual revenue if current pace holds.",
      proposed_sql: `SELECT ROUND(SUM(COALESCE("${revCol}", 0)) / NULLIF(COUNT(DISTINCT "${tc.name}"), 0) * 12, 0) AS annualized_collections FROM ${schema}`,
      chart_type: "number",
    })
  }

  if (netCol && tc) {
    kpis.push({
      name: "Projected Annual Net Income",
      description: "Average monthly net income × 12 — projects annual profit at current run-rate.",
      proposed_sql: `SELECT ROUND(AVG(monthly_total) * 12, 0) AS projected_annual_income FROM (SELECT "${tc.name}", SUM(COALESCE("${netCol}", 0)) AS monthly_total FROM ${schema} GROUP BY "${tc.name}") sub`,
      chart_type: "number",
    })
  }

  // Fallback: if we ended up with very few KPIs, add generic ones for each numeric column
  if (kpis.length < 5 && nums.length > 0) {
    for (const n of nums.slice(0, 3)) {
      if (!kpis.some(k => k.proposed_sql.includes(`"${n.name}"`))) {
        kpis.push({
          name: `Total ${n.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
          description: `Sum of all ${n.name.replace(/_/g, " ")} values in the dataset.`,
          proposed_sql: `SELECT SUM(COALESCE("${n.name}", 0)) AS total_${n.name} FROM ${schema}`,
          chart_type: "number",
        })
      }
    }
  }

  return kpis
}
