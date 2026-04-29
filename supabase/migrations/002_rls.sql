-- ── Row Level Security policies ───────────────────────────────────────────────
-- Every table with user data gets RLS. The rule: you see only what
-- belongs to workspaces you are a member of.

-- Helper function used in all workspace-scoped policies
CREATE OR REPLACE FUNCTION is_workspace_member(wid UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = wid AND user_id = auth.uid()
  )
$$;

-- ── Profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (id = auth.uid());

-- ── Workspaces ────────────────────────────────────────────────────────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces: members can read" ON workspaces
  FOR SELECT USING (is_workspace_member(id));

CREATE POLICY "workspaces: owner can update" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "workspaces: owner can delete" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Insert is handled via service role in API routes (needs schema creation first)

-- ── Workspace members ─────────────────────────────────────────────────────────
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members: members can read" ON workspace_members
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace_members: owners/admins can insert" ON workspace_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ── Datasets ──────────────────────────────────────────────────────────────────
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datasets: workspace members can read" ON datasets
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "datasets: workspace members can insert" ON datasets
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "datasets: owners/admins can delete" ON datasets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = datasets.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ── KPI proposals ─────────────────────────────────────────────────────────────
ALTER TABLE kpi_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_proposals: workspace members can read" ON kpi_proposals
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "kpi_proposals: workspace members can insert" ON kpi_proposals
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "kpi_proposals: workspace members can update" ON kpi_proposals
  FOR UPDATE USING (is_workspace_member(workspace_id));

-- ── AI usage log ──────────────────────────────────────────────────────────────
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_log: owners/admins can read" ON ai_usage_log
  FOR SELECT USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = ai_usage_log.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Service role bypasses RLS for inserts from the AI logging code
