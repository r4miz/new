-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";  -- needed for slice 3 RAG

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with display info
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Workspaces ────────────────────────────────────────────────────────────────
CREATE TABLE workspaces (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  industry                TEXT,
  size                    TEXT,
  primary_currency        TEXT NOT NULL DEFAULT 'USD',
  owner_id                UUID NOT NULL REFERENCES auth.users(id),
  schema_name             TEXT UNIQUE NOT NULL,  -- ws_{uuid_no_hyphens}
  subscription_status     TEXT NOT NULL DEFAULT 'trialing'
                          CHECK (subscription_status IN ('trialing','active','past_due','canceled','expired')),
  trial_ends_at           TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Workspace members ─────────────────────────────────────────────────────────
CREATE TABLE workspace_members (
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner','admin','member','viewer')),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, user_id)
);

-- ── Datasets ──────────────────────────────────────────────────────────────────
-- Metadata for every CSV/Excel file imported into a workspace.
-- The actual data lives in ws_{id}.{table_name}.
CREATE TABLE datasets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  table_name        TEXT NOT NULL,
  original_filename TEXT,
  row_count         INTEGER,
  column_metadata   JSONB NOT NULL DEFAULT '[]',
  ai_description    TEXT,
  storage_path      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, table_name)
);

-- ── KPI proposals ─────────────────────────────────────────────────────────────
CREATE TABLE kpi_proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  dataset_id    UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  proposed_sql  TEXT NOT NULL,
  chart_type    TEXT NOT NULL DEFAULT 'bar'
                CHECK (chart_type IN ('bar','line','area','number')),
  status        TEXT NOT NULL DEFAULT 'proposed'
                CHECK (status IN ('proposed','accepted','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI usage log ──────────────────────────────────────────────────────────────
CREATE TABLE ai_usage_log (
  id                BIGSERIAL PRIMARY KEY,
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  model             TEXT NOT NULL,
  endpoint          TEXT NOT NULL,
  prompt_tokens     INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  cost_usd          NUMERIC(10,6),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_datasets_workspace     ON datasets(workspace_id);
CREATE INDEX idx_kpi_proposals_workspace ON kpi_proposals(workspace_id);
CREATE INDEX idx_ai_usage_workspace     ON ai_usage_log(workspace_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
