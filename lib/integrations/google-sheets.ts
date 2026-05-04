import { adminClient } from "@/lib/supabase/admin"
import type { RawSyncData } from "./types"

interface GoogleCredentials {
  access_token:  string
  refresh_token: string
  expires_at:    number // ms timestamp
}

async function getValidToken(integrationId: string, creds: GoogleCredentials): Promise<string> {
  if (Date.now() < creds.expires_at - 60_000) return creds.access_token

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: creds.refresh_token,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
    }),
  })
  const json = await res.json()
  if (json.error) throw new Error(`Google token refresh failed: ${json.error_description ?? json.error}`)

  const newCreds: GoogleCredentials = {
    access_token:  json.access_token,
    refresh_token: creds.refresh_token,
    expires_at:    Date.now() + json.expires_in * 1000,
  }
  await adminClient.from("integrations").update({ credentials: newCreds }).eq("id", integrationId)
  return newCreds.access_token
}

export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : urlOrId
}

export async function fetchGoogleSheet(params: {
  integrationId: string
  credentials:   GoogleCredentials
  sheetId:       string
  datasetName:   string
}): Promise<RawSyncData> {
  const token = await getValidToken(params.integrationId, params.credentials)

  const sheetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${params.sheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!sheetRes.ok) throw new Error(`Sheets API error: ${sheetRes.status}`)
  const sheetMeta = await sheetRes.json()
  const firstSheet = sheetMeta.sheets?.[0]?.properties?.title ?? "Sheet1"

  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${params.sheetId}/values/${encodeURIComponent(firstSheet)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!valRes.ok) throw new Error(`Sheets values API error: ${valRes.status}`)
  const valJson = await valRes.json()

  const raw = (valJson.values ?? []) as string[][]
  if (raw.length < 2) throw new Error("Sheet has no data rows")

  const headers  = raw[0].map((h) => h.trim()).filter(Boolean)
  const dataRows = raw.slice(1)

  const rows: Record<string, string>[] = dataRows.map((row) => {
    const out: Record<string, string> = {}
    headers.forEach((h, i) => { out[h] = (row[i] ?? "").trim() })
    return out
  })

  return { name: params.datasetName, headers, rows }
}

export function buildGoogleOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/spreadsheets.readonly",
    access_type:   "offline",
    prompt:        "consent",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string): Promise<GoogleCredentials> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
      grant_type:    "authorization_code",
    }),
  })
  const json = await res.json()
  if (json.error) throw new Error(`Google code exchange failed: ${json.error_description ?? json.error}`)
  return {
    access_token:  json.access_token,
    refresh_token: json.refresh_token,
    expires_at:    Date.now() + json.expires_in * 1000,
  }
}
