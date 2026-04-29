export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"

export type ChartType = "bar" | "line" | "area" | "number"

export type KpiStatus = "proposed" | "accepted" | "rejected"

export type SqlType = "TEXT" | "NUMERIC" | "DATE" | "TIMESTAMPTZ" | "BOOLEAN"

export interface ColumnMetadata {
  name: string          // sanitized column name used in Postgres
  original_name: string // raw header from the CSV
  sql_type: SqlType
  ai_inferred_type: string  // semantic label, e.g. "monthly revenue amount"
  sample_values: string[]
}

export interface Workspace {
  id: string
  slug: string
  name: string
  industry: string | null
  size: string | null
  primary_currency: string
  owner_id: string
  schema_name: string
  subscription_status: SubscriptionStatus
  trial_ends_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_at: string
  accepted_at: string | null
}

export interface Dataset {
  id: string
  workspace_id: string
  name: string
  table_name: string
  original_filename: string | null
  row_count: number | null
  column_metadata: ColumnMetadata[]
  ai_description: string | null
  storage_path: string | null
  created_at: string
}

export interface KpiProposal {
  id: string
  workspace_id: string
  dataset_id: string
  name: string
  description: string
  proposed_sql: string
  chart_type: ChartType
  status: KpiStatus
  created_at: string
}

export interface AiUsageLog {
  id: number
  workspace_id: string | null
  model: string
  endpoint: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number | null
  created_at: string
}

// API response shapes
export interface ParsedDataset {
  columns: ColumnMetadata[]
  description: string
  row_count: number
}

export interface ProposedKpi {
  name: string
  description: string
  proposed_sql: string
  chart_type: ChartType
}
