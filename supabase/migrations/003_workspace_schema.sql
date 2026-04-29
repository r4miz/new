-- ── Workspace schema management ───────────────────────────────────────────────
-- Functions called via service role to create/drop ws_* schemas for each tenant.

-- Creates a workspace schema and grants the ai_query_role SELECT access.
-- Called once when a workspace is created.
CREATE OR REPLACE FUNCTION create_workspace_schema(p_schema_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Validate schema name format (ws_ prefix + 32 hex chars)
  IF NOT (p_schema_name ~ '^ws_[a-f0-9]{32}$') THEN
    RAISE EXCEPTION 'Invalid workspace schema name: %', p_schema_name;
  END IF;

  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

  -- Grant authenticated role usage so server-side queries work
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', p_schema_name);

  -- Grant ai_query_role SELECT on all current and future tables in the schema
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO ai_query_role', p_schema_name);
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT ON TABLES TO ai_query_role',
    p_schema_name
  );
END;
$$;

-- Drops a workspace schema and all its tables.
-- Called when a workspace is deleted (with data preservation window logic in app code).
CREATE OR REPLACE FUNCTION drop_workspace_schema(p_schema_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT (p_schema_name ~ '^ws_[a-f0-9]{32}$') THEN
    RAISE EXCEPTION 'Invalid workspace schema name: %', p_schema_name;
  END IF;
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', p_schema_name);
END;
$$;

-- ── ai_query_role ─────────────────────────────────────────────────────────────
-- Read-only role used exclusively for executing AI-generated SQL.
-- Has SELECT only. Statement timeout enforced.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_query_role') THEN
    CREATE ROLE ai_query_role NOLOGIN NOINHERIT;
  END IF;
END;
$$;

-- Enforce a 10-second statement timeout for all ai_query_role sessions
ALTER ROLE ai_query_role SET statement_timeout = '10s';
