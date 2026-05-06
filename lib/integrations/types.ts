export type IntegrationProvider =
  | "google_sheets"
  | "shopify"
  | "woocommerce"
  | "hubspot"
  | "stripe_data"
  | "airtable"

export type IntegrationStatus  = "pending" | "active" | "error" | "paused"
export type SyncFrequency      = "manual" | "daily" | "weekly"

export interface Integration {
  id:             string
  workspace_id:   string
  provider:       IntegrationProvider
  name:           string
  status:         IntegrationStatus
  credentials:    Record<string, unknown>
  config:         Record<string, unknown>
  dataset_id:     string | null
  sync_frequency: SyncFrequency
  last_synced_at: string | null
  last_error:     string | null
  created_at:     string
}

export interface RawSyncData {
  name:    string
  headers: string[]
  rows:    Record<string, string>[]
}
