import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { parseCSV } from "@/lib/csv/parser"
import { sanitizeTableName, workspaceSchemaName } from "@/lib/utils"

export const maxDuration = 60

const BATCH_SIZE = 250

export async function POST(request: Request) {
  // Step 1: auth
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: `[step1-auth] ${authErr?.message ?? "no user"}` }, { status: 401 })
  }

  // Step 2: form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
    return NextResponse.json({ error: `[step2-form] ${e}` }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const workspaceId = formData.get("workspace_id") as string | null
  const datasetName = formData.get("name") as string | null

  if (!file || !workspaceId || !datasetName) {
    return NextResponse.json({
      error: `[step2-missing] file=${!!file} workspace_id=${workspaceId} name=${datasetName}`
    }, { status: 400 })
  }

  // Step 3: verify membership
  const { data: membership, error: memberErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (memberErr) {
    return NextResponse.json({ error: `[step3-member-query] ${memberErr.message}` }, { status: 500 })
  }
  if (!membership) {
    return NextResponse.json({ error: `[step3-no-member] workspace_id=${workspaceId} user=${user.id}` }, { status: 403 })
  }

  // Step 4: parse CSV
  let parsed
  try {
    const content = await file.text()
    parsed = parseCSV(content, file.name)
  } catch (err) {
    return NextResponse.json({ error: `[step4-parse] ${err}` }, { status: 400 })
  }

  // Step 5: insert dataset metadata (generate ID upfront for unique table name)
  const datasetId = crypto.randomUUID()
  const tableName = sanitizeTableName(datasetName) + "_" + datasetId.replace(/-/g, "").slice(0, 8)

  const { data: dataset, error: dsErr } = await adminClient
    .from("datasets")
    .insert({
      id: datasetId,
      workspace_id: workspaceId,
      name: datasetName,
      table_name: tableName,
      original_filename: file.name,
      row_count: parsed.rowCount,
      column_metadata: parsed.columnMetadata,
      storage_path: null,
    })
    .select()
    .single()

  if (dsErr) {
    return NextResponse.json({ error: `[step5-insert] ${dsErr.message}` }, { status: 500 })
  }

  // Step 6: create the Postgres table for this dataset
  const schemaName = workspaceSchemaName(workspaceId)
  const columnDefs = parsed.columnMetadata.map((c) => ({ name: c.name, sql_type: c.sql_type }))

  const { error: ctErr } = await adminClient.rpc("create_dataset_table", {
    p_schema_name: schemaName,
    p_table_name: tableName,
    p_columns: columnDefs,
  })
  if (ctErr) {
    return NextResponse.json({ error: `[step6-create-table] ${ctErr.message}` }, { status: 500 })
  }

  // Step 7: insert rows in batches, mapping original header names → sanitized column names
  for (let i = 0; i < parsed.rows.length; i += BATCH_SIZE) {
    const batch = parsed.rows.slice(i, i + BATCH_SIZE).map((row) => {
      const out: Record<string, string> = {}
      parsed.columnMetadata.forEach((col) => {
        out[col.name] = row[col.original_name] ?? ""
      })
      return out
    })

    const { error: insErr } = await adminClient.rpc("insert_dataset_batch", {
      p_schema_name: schemaName,
      p_table_name: tableName,
      p_rows: batch,
      p_columns: columnDefs,
    })
    if (insErr) {
      return NextResponse.json({ error: `[step7-insert-rows] batch=${i} ${insErr.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ dataset })
}
