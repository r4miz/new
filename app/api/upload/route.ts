import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { parseCSV, buildCreateTableSQL, rowToValues } from "@/lib/csv/parser"
import { sanitizeTableName } from "@/lib/utils"
import type { ColumnMetadata } from "@/lib/types"

// Vercel body size limit is 4.5MB. For larger files, clients should upload
// directly to Supabase Storage and pass the storage_path instead.
export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const workspaceId = formData.get("workspace_id") as string | null
  const datasetName = formData.get("name") as string | null

  if (!file || !workspaceId || !datasetName) {
    return NextResponse.json({ error: "Missing file, workspace_id, or name" }, { status: 400 })
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Get workspace schema
  const { data: workspace } = await adminClient
    .from("workspaces")
    .select("schema_name")
    .eq("id", workspaceId)
    .single()
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const schemaName = workspace.schema_name
  const content = await file.text()

  // Parse the CSV
  let parsed
  try {
    parsed = parseCSV(content, file.name)
  } catch (err: unknown) {
    return NextResponse.json({ error: `CSV parse failed: ${err}` }, { status: 400 })
  }

  // Generate a unique table name within the workspace
  let tableName = sanitizeTableName(datasetName)
  const { data: existing } = await adminClient
    .from("datasets")
    .select("table_name")
    .eq("workspace_id", workspaceId)
    .eq("table_name", tableName)
    .maybeSingle()
  if (existing) tableName = `${tableName}_${Date.now()}`

  // Create the table in the workspace schema via bizintel_exec_sql RPC
  const createSQL = buildCreateTableSQL(schemaName, tableName, parsed.columnMetadata)
  const { error: createErr } = await adminClient.rpc("bizintel_exec_sql", { sql: createSQL })
  if (createErr) {
    return NextResponse.json(
      { error: `Table creation failed: ${createErr.message}` },
      { status: 500 }
    )
  }

  // Bulk insert rows via bizintel_exec_sql (batches of 100 to stay under RPC payload limits)
  const columns: ColumnMetadata[] = parsed.columnMetadata
  const BATCH = 100
  for (let i = 0; i < parsed.rows.length; i += BATCH) {
    const batch = parsed.rows.slice(i, i + BATCH)

    // Build a multi-row INSERT with escaped values
    const colList = columns.map((c) => `"${c.name}"`).join(", ")
    const valueClauses = batch.map((row) => {
      const vals = rowToValues(row, columns).map((v) => {
        if (v === null) return "NULL"
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE"
        if (typeof v === "number") return String(v)
        // Escape single quotes in strings
        return `'${String(v).replace(/'/g, "''")}'`
      })
      return `(${vals.join(", ")})`
    })

    const insertSQL = `INSERT INTO "${schemaName}"."${tableName}" (${colList}) VALUES ${valueClauses.join(",\n")}`
    const { error: insertErr } = await adminClient.rpc("bizintel_exec_sql", { sql: insertSQL })
    if (insertErr) {
      return NextResponse.json(
        { error: `Row insert failed: ${insertErr.message}` },
        { status: 500 }
      )
    }
  }

  // Save dataset metadata
  const { data: dataset, error: dsErr } = await adminClient
    .from("datasets")
    .insert({
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
    return NextResponse.json({ error: "Failed to save dataset metadata" }, { status: 500 })
  }

  return NextResponse.json({ dataset })
}
