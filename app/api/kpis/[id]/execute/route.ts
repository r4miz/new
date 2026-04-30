import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { validateKpiSql } from "@/lib/sql/validator"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: "[exec-auth]" }, { status: 401 })
  }

  const { data: kpi, error: kpiErr } = await adminClient
    .from("kpi_proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (kpiErr) return NextResponse.json({ error: `[exec-kpi-err] ${kpiErr.message}` }, { status: 500 })
  if (!kpi) return NextResponse.json({ error: "[exec-kpi-missing]" }, { status: 404 })

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", kpi.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: "[exec-no-member]" }, { status: 403 })

  const validation = validateKpiSql(kpi.proposed_sql)
  if (!validation.valid) {
    return NextResponse.json({ error: `[exec-invalid-sql] ${validation.error}` }, { status: 400 })
  }

  const { data: rows, error: execErr } = await adminClient.rpc("run_kpi_query", {
    p_sql: kpi.proposed_sql,
  })
  if (execErr) return NextResponse.json({ error: `[exec-run] ${execErr.message}` }, { status: 500 })

  return NextResponse.json({ rows })
}
