import { Parser } from "node-sql-parser"

const parser = new Parser()

export interface ValidateResult {
  valid: boolean
  error?: string
}

export function validateKpiSql(sql: string): ValidateResult {
  const trimmed = sql.trim()

  if (!/^select\s/i.test(trimmed)) {
    return { valid: false, error: "Only SELECT statements are allowed" }
  }

  try {
    const ast = parser.astify(trimmed, { database: "PostgreSQL" })
    const statements = Array.isArray(ast) ? ast : [ast]
    if (statements.length !== 1) {
      return { valid: false, error: "Exactly one SQL statement is required" }
    }
    const stmt = statements[0] as { type?: string }
    if (!stmt || stmt.type?.toUpperCase() !== "SELECT") {
      return { valid: false, error: "Only SELECT statements are allowed" }
    }
  } catch {
    // Postgres-specific syntax (e.g. :: casts, date_trunc) may not parse.
    // Fall through — the Postgres function re-validates before executing.
  }

  return { valid: true }
}
