import Papa from "papaparse"
import type { ColumnMetadata, SqlType } from "@/lib/types"
import { sanitizeTableName } from "@/lib/utils"

export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
  columnMetadata: ColumnMetadata[]
  rowCount: number
}

function inferSqlType(values: string[]): SqlType {
  const nonEmpty = values.filter((v) => v !== "" && v !== null)
  if (nonEmpty.length === 0) return "TEXT"

  // Boolean
  const boolSet = new Set(["true", "false", "yes", "no", "1", "0"])
  if (nonEmpty.every((v) => boolSet.has(v.toLowerCase()))) return "BOOLEAN"

  // Numeric
  if (nonEmpty.every((v) => !isNaN(Number(v)) && v.trim() !== "")) return "NUMERIC"

  // Timestamp (with time)
  const tsPattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/
  if (nonEmpty.every((v) => tsPattern.test(v))) return "TIMESTAMPTZ"

  // Date only
  const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/
  if (nonEmpty.every((v) => datePattern.test(v))) return "DATE"

  return "TEXT"
}

function sanitizeColumnName(header: string, index: number): string {
  const sanitized = header
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[0-9]/, "c$&")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60)
  return sanitized || `column_${index}`
}

export function parseCSV(content: string, filename: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`)
  }

  const headers = result.meta.fields ?? []
  const rows = result.data as Record<string, string>[]

  const columnMetadata: ColumnMetadata[] = headers.map((header, i) => {
    const columnValues = rows.slice(0, 100).map((r) => r[header] ?? "")
    const sampleValues = columnValues.slice(0, 5)
    return {
      name: sanitizeColumnName(header, i),
      original_name: header,
      sql_type: inferSqlType(columnValues),
      ai_inferred_type: "",  // filled in by AI parse step
      sample_values: sampleValues,
    }
  })

  return { headers, rows, columnMetadata, rowCount: rows.length }
}

export function buildCreateTableSQL(
  schemaName: string,
  tableName: string,
  columns: ColumnMetadata[]
): string {
  const colDefs = columns
    .map((c) => `  "${c.name}" ${c.sql_type}`)
    .join(",\n")
  return `CREATE TABLE IF NOT EXISTS "${schemaName}"."${tableName}" (\n  _row_id BIGSERIAL PRIMARY KEY,\n${colDefs}\n)`
}

export function buildInsertSQL(
  schemaName: string,
  tableName: string,
  columns: ColumnMetadata[]
): string {
  const colNames = columns.map((c) => `"${c.name}"`).join(", ")
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ")
  return `INSERT INTO "${schemaName}"."${tableName}" (${colNames}) VALUES (${placeholders})`
}

export function rowToValues(
  row: Record<string, string>,
  columns: ColumnMetadata[]
): (string | number | boolean | null)[] {
  return columns.map((col) => {
    const raw = row[col.original_name]
    if (raw === "" || raw === undefined || raw === null) return null
    if (col.sql_type === "NUMERIC") {
      const n = Number(raw)
      return isNaN(n) ? null : n
    }
    if (col.sql_type === "BOOLEAN") {
      return ["true", "yes", "1"].includes(raw.toLowerCase())
    }
    return raw
  })
}
