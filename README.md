# BizIntel

AI-generated analytics for any business. Upload your data, get instant KPIs.

## Local setup

### Prerequisites
- Node.js 18+, Supabase project, Anthropic API key

### 1. Environment
```bash
cp .env.local.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
```

### 2. Database — run migrations in Supabase SQL editor in order
```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_workspace_schema.sql
```

### 3. Run
```bash
npm install
npm run dev
```
Open http://localhost:3000 — sign up, create a workspace, upload a CSV, see a KPI.

## Docs
- [ARCHITECTURE.md](./ARCHITECTURE.md) — data model, sandbox design
- [PROJECT.md](./PROJECT.md) — slice-by-slice plan
- [DECISIONS.md](./DECISIONS.md) — decision log
