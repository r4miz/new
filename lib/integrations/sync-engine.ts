import { adminClient } from "@/lib/supabase/admin"
import { sanitizeTableName, workspaceSchemaName } from "@/lib/utils"
import { setupDatasetAI } from "@/lib/ai/setup"
import type { RawSyncData } from "./types"
import type { ColumnMetadata, SqlType } from "@/lib/types"

const BATCH_SIZE = 250

function inferSqlType(values: string[]): SqlType {
  const nonEmpty = values.filter((v) => v !== "" && v !== null && v !== undefined)
  if (nonEmpty.length === 0) return "TEXT"
  if (nonEmpty.every((v) => !isNaN(Number(v)) && v.trim() !== "")) return "NUMERIC"
  const tsPattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/
  if (nonEmpty.every((v) => tsPattern.test(v))) return "TIMESTAMPTZ"
  const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/
  if (nonEmpty.every((v) => datePattern.test(v))) return "DATE"
  return "TEXT"
}

function sanitizeColName(header: string, index: number): string {
  const s = header.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^[0-9]/, "c$&").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60)
  return s || `column_${index}`
}

/**
 * Imports raw sync data into the workspace Postgres schema.
 * - First sync (existingDatasetId = null): creates dataset + table, runs AI setup
 * - Re-sync (existingDatasetId set): truncates table, re-inserts rows, skips AI
 */
export async function runSync(params: {
  workspaceId:       string
  integrationId:     string
  data:              RawSyncData
  existingDatasetId: string | null
}): Promise<{ datasetId: string }> {
  const { workspaceId, integrationId, data, existingDatasetId } = params
  const schemaName = workspaceSchemaName(workspaceId)
  const isInitial  = !existingDatasetId

  // ── Build column metadata ──────────────────────────────────────────────────
  const columnMetadata: ColumnMetadata[] = data.headers.map((header, i) => {
    const allValues  = data.rows.map((r) => r[header] ?? "")
    const nonEmpty   = allValues.filter(Boolean)
    const sampleVals = allValues.slice(0, 5)
    return {
      name:            sanitizeColName(header, i),
      original_name:   header,
      sql_type:        inferSqlType(nonEmpty.slice(0, 100)),
      ai_inferred_type: "",
      sample_values:   sampleVals,
    }
  })
  const columnDefs = columnMetadata.map((c) => ({ name: c.name, sql_type: c.sql_type }))

  // ── Dataset record ─────────────────────────────────────────────────────────
  let datasetId: string

  if (isInitial) {
    const newId    = crypto.randomUUID()
    const baseName = sanitizeTableName(data.name).slice(0, 50)
    const tableName = `${baseName}_${newId.replace(/-/g, "").slice(0, 8)}`

    const { data: dataset, error } = await adminClient.from("datasets").insert({
      id:               newId,
      workspace_id:     workspaceId,
      name:             data.name,
      table_name:       tableName,
      original_filename: null,
      row_count:        data.rows.length,
      column_metadata:  columnMetadata,
    }).select().single()
    if (error) throw new Error(`Dataset insert failed: ${error.message}`)

    await adminClient.rpc("create_dataset_table", {
      p_schema_name: schemaName,
      p_table_name:  tableName,
      p_columns:     columnDefs,
    })

    datasetId = dataset.id

    // Link integration → dataset
    await adminClient.from("integrations").update({ dataset_id: datasetId }).eq("id", integrationId)
  } else {
    datasetId = existingDatasetId

    // Get current table name
    const { data: ds } = await adminClient.from("datasets").select("table_name").eq("id", datasetId).single()
    if (!ds) throw new Error("Dataset not found")

    // Truncate and update metadata
    await adminClient.rpc("truncate_dataset_table", {
      p_schema_name: schemaName,
      p_table_name:  ds.table_name,
    })

    await adminClient.from("datasets").update({
      row_count:       data.rows.length,
      column_metadata: columnMetadata,
    }).eq("id", datasetId)

    // Re-insert using updated table name
    const { data: fresh } = await adminClient.from("datasets").select("table_name").eq("id", datasetId).single()
    const tableName = fresh!.table_name

    for (let i = 0; i < data.rows.length; i += BATCH_SIZE) {
      const batch = data.rows.slice(i, i + BATCH_SIZE).map((row) => {
        const out: Record<string, string> = {}
        columnMetadata.forEach((col) => { out[col.name] = row[col.original_name] ?? "" })
        return out
      })
      const { error } = await adminClient.rpc("insert_dataset_batch", {
        p_schema_name: schemaName,
        p_table_name:  tableName,
        p_rows:        batch,
        p_columns:     columnDefs,
      })
      if (error) throw new Error(`Batch insert failed: ${error.message}`)
    }

    return { datasetId }
  }

  // Initial sync: insert rows then run AI setup
  const { data: ds } = await adminClient.from("datasets").select("table_name").eq("id", datasetId).single()
  const tableName = ds!.table_name

  for (let i = 0; i < data.rows.length; i += BATCH_SIZE) {
    const batch = data.rows.slice(i, i + BATCH_SIZE).map((row) => {
      const out: Record<string, string> = {}
      columnMetadata.forEach((col) => { out[col.name] = row[col.original_name] ?? "" })
      return out
    })
    const { error } = await adminClient.rpc("insert_dataset_batch", {
      p_schema_name: schemaName,
      p_table_name:  tableName,
      p_rows:        batch,
      p_columns:     columnDefs,
    })
    if (error) throw new Error(`Batch insert failed: ${error.message}`)
  }

  await setupDatasetAI(datasetId, workspaceId)
  return { datasetId }
}
