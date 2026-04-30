-- ── Slice 1.5 — Dataset table creation, bulk ingestion, and KPI execution ─────

-- Creates a typed table in the workspace schema for a dataset.
-- p_columns: [{name TEXT, sql_type TEXT}, ...]
CREATE OR REPLACE FUNCTION create_dataset_table(
  p_schema_name  TEXT,
  p_table_name   TEXT,
  p_columns      JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_col_defs TEXT := '';
  v_col      JSONB;
  v_name     TEXT;
  v_type     TEXT;
  v_first    BOOLEAN := TRUE;
BEGIN
  IF NOT (p_schema_name ~ '^ws_[a-f0-9]{32}$') THEN
    RAISE EXCEPTION 'Invalid schema name: %', p_schema_name;
  END IF;
  IF NOT (p_table_name ~ '^[a-z][a-z0-9_]{0,62}$') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  FOR v_col IN SELECT value FROM jsonb_array_elements(p_columns)
  LOOP
    v_name := v_col->>'name';
    v_type := v_col->>'sql_type';
    IF v_type NOT IN ('TEXT','NUMERIC','DATE','TIMESTAMPTZ','BOOLEAN') THEN
      v_type := 'TEXT';
    END IF;
    IF NOT v_first THEN v_col_defs := v_col_defs || ', '; END IF;
    v_col_defs := v_col_defs || format('%I %s', v_name, v_type);
    v_first := FALSE;
  END LOOP;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I.%I (_row_id BIGSERIAL PRIMARY KEY, %s)',
    p_schema_name, p_table_name, v_col_defs
  );

  EXECUTE format('GRANT SELECT ON %I.%I TO ai_query_role', p_schema_name, p_table_name);
END;
$$;

-- Bulk-inserts a JSONB array of row objects into a dataset table.
-- Reads every value as TEXT then casts to the target type, converting '' → NULL.
-- p_rows:    [{col_name: value, ...}, ...]
-- p_columns: [{name, sql_type}, ...]
CREATE OR REPLACE FUNCTION insert_dataset_batch(
  p_schema_name  TEXT,
  p_table_name   TEXT,
  p_rows         JSONB,
  p_columns      JSONB
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_read_defs  TEXT;
  v_col_names  TEXT;
  v_cast_exprs TEXT;
  v_count      INT;
BEGIN
  IF NOT (p_schema_name ~ '^ws_[a-f0-9]{32}$') THEN
    RAISE EXCEPTION 'Invalid schema name: %', p_schema_name;
  END IF;
  IF NOT (p_table_name ~ '^[a-z][a-z0-9_]{0,62}$') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Build parallel lists from p_columns:
  --   v_read_defs  — "col TEXT, ..."  used in jsonb_to_recordset AS t(...)
  --   v_col_names  — "col, ..."       used in INSERT target list
  --   v_cast_exprs — "CASE WHEN t.col='' THEN NULL ELSE t.col END::TYPE, ..."
  SELECT
    string_agg(format('%I text', value->>'name'), ', ' ORDER BY ord),
    string_agg(format('%I', value->>'name'), ', ' ORDER BY ord),
    string_agg(
      format(
        $f$CASE WHEN t.%I = '' THEN NULL ELSE t.%I END::%s$f$,
        value->>'name',
        value->>'name',
        CASE
          WHEN (value->>'sql_type') IN ('NUMERIC','DATE','TIMESTAMPTZ','BOOLEAN')
          THEN value->>'sql_type'
          ELSE 'TEXT'
        END
      ),
      ', ' ORDER BY ord
    )
  INTO v_read_defs, v_col_names, v_cast_exprs
  FROM jsonb_array_elements(p_columns) WITH ORDINALITY AS t(value, ord);

  EXECUTE format(
    'INSERT INTO %I.%I (%s) SELECT %s FROM jsonb_to_recordset($1) AS t(%s)',
    p_schema_name, p_table_name, v_col_names, v_cast_exprs, v_read_defs
  ) USING p_rows;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Validates and executes a read-only KPI SQL query.
-- Returns up to 1000 rows as a JSONB array.
-- Defence-in-depth: node-sql-parser validates on the API side first,
-- this function re-checks before executing.
CREATE OR REPLACE FUNCTION run_kpi_query(p_sql TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (trim(p_sql) ~* '^SELECT\s') THEN
    RAISE EXCEPTION 'Only SELECT queries are permitted';
  END IF;

  EXECUTE format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (%s LIMIT 1000) t',
    p_sql
  ) INTO v_result;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
