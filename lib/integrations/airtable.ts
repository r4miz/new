import type { RawSyncData } from "./types"

export function extractAirtableIds(input: string): { baseId: string; tableId: string } | null {
  // URL format: https://airtable.com/appXXX/tblXXX/...
  const match = input.match(/airtable\.com\/(app[A-Za-z0-9]+)\/(tbl[A-Za-z0-9]+|[^/]+)/)
  if (match) return { baseId: match[1], tableId: match[2] }
  return null
}

export async function validateAirtableToken(token: string, baseId: string, tableId: string): Promise<void> {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}?maxRecords=1`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Airtable validation failed (${res.status}). Check your token, base ID, and table name.`)
}

export async function fetchAirtableRecords(params: {
  token:       string
  baseId:      string
  tableId:     string
  datasetName: string
}): Promise<RawSyncData> {
  const { token, baseId, tableId, datasetName } = params
  const headers = { Authorization: `Bearer ${token}` }
  const records: Record<string, string>[] = []
  let headers_: string[] | null = null
  let offset: string | undefined

  while (true) {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}`)
    url.searchParams.set("pageSize", "100")
    if (offset) url.searchParams.set("offset", offset)

    const res  = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`Airtable API error: ${res.status}`)
    const json = await res.json()

    for (const rec of json.records ?? []) {
      const fields = rec.fields as Record<string, unknown>
      if (!headers_) headers_ = Object.keys(fields)
      const row: Record<string, string> = { airtable_id: rec.id }
      for (const key of headers_) {
        const val = fields[key]
        row[key] = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val)
      }
      records.push(row)
    }

    offset = json.offset
    if (!offset) break
  }

  const finalHeaders = headers_ ? ["airtable_id", ...headers_] : ["airtable_id"]
  return { name: datasetName, headers: finalHeaders, rows: records }
}
