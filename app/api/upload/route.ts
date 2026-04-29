import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { parseCSV } from "@/lib/csv/parser"
import { sanitizeTableName } from "@/lib/utils"

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

  const content = await file.text()

  let parsed
  try {
    parsed = parseCSV(content, file.name)
  } catch (err: unknown) {
    return NextResponse.json({ error: `CSV parse failed: ${err}` }, { status: 400 })
  }

  const tableName = sanitizeTableName(datasetName)

  // Slice 1: store column metadata + sample rows in datasets table.
  // The actual workspace schema table is created in slice 1.5 when we
  // build the sandboxed SQL executor. The AI only needs schema info to
  // propose KPIs — it doesn't execute the SQL yet.
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
    return NextResponse.json({ error: `Failed to save dataset: ${dsErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ dataset })
}
