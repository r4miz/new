-- ── Integrations — external data source connections ──────────────────────────

CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('google_sheets', 'shopify')),
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'error', 'paused')),
  credentials     JSONB NOT NULL DEFAULT '{}',
  config          JSONB NOT NULL DEFAULT '{}',
  dataset_id      UUID REFERENCES datasets(id) ON DELETE SET NULL,
  sync_frequency  TEXT NOT NULL DEFAULT 'daily'
                  CHECK (sync_frequency IN ('manual', 'daily', 'weekly')),
  last_synced_at  TIMESTAMPTZ,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX idx_integrations_active    ON integrations(status, last_synced_at)
  WHERE status = 'active';

-- Truncates a dataset table in preparation for a re-sync.
CREATE OR REPLACE FUNCTION truncate_dataset_table(
  p_schema_name TEXT,
  p_table_name  TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT (p_schema_name ~ '^ws_[a-f0-9]{32}$') THEN
    RAISE EXCEPTION 'Invalid schema name: %', p_schema_name;
  END IF;
  IF NOT (p_table_name ~ '^[a-z][a-z0-9_]{0,62}$') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  EXECUTE format('TRUNCATE TABLE %I.%I', p_schema_name, p_table_name);
END;
$$;
