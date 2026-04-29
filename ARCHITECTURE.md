# Architecture

## Overview

BizIntel is a Next.js 16 app (App Router) backed by Supabase (Postgres + Auth + Storage).
All business logic lives in `lib/` service modules. API routes in `app/api/` are thin
orchestrators — they validate input, call service functions, and return JSON.

## Multi-tenancy model

Every user belongs to one or more **workspaces**. Every row of user data has a
`workspace_id`. Supabase RLS policies enforce that users only see data for workspaces
they are members of.

### Workspace Postgres schemas

Each workspace gets its own Postgres schema: `ws_{uuid_no_hyphens}`.

**Why a separate schema per workspace, not a single shared schema with workspace_id?**
- Clean isolation: `DROP SCHEMA ws_xyz CASCADE` removes all of a workspace's data
- The AI SQL sandbox only needs to know one schema name — it can't accidentally
  reference another workspace's tables even if it tries
- Grant/revoke permissions at the schema level (no row-level grants needed)

**Schema name convention:**
UUIDs contain hyphens which are illegal in unquoted Postgres identifiers.
We strip them: `ws_` + UUID without hyphens = 32 hex chars.
Example: workspace `3f4a5b6c-7d8e-9f0a-1b2c-3d4e5f6a7b8c`
→ schema `ws_3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c`

### Dataset tables

Each uploaded CSV becomes a real Postgres table inside the workspace schema.
Table name is derived from the dataset name (sanitized, max 50 chars).
A `_row_id BIGSERIAL` primary key is always added.

The `datasets` table in the public schema tracks metadata:
column names, inferred types, AI description, row count, storage path.

## AI-generated SQL sandbox (slice 1.5)

**THIS IS THE HIGHEST-RISK COMPONENT. Do not rush this.**

### Roles

| Role | Purpose | Permissions |
|---|---|---|
| `authenticated` | Next.js backend (anon key + user JWT) | Can read public schema tables they own |
| service role | Next.js API routes with admin client | Bypasses RLS, creates schemas, ingests data |
| `ai_query_role` | Executing AI-generated SQL only | SELECT only, statement_timeout=10s |

### Execution flow (slice 1.5)

1. AI generates a SQL string (during propose step)
2. Before any execution: SQL is validated with a real parser (not regex):
   - Must parse as a single SELECT statement
   - Must reference only tables in the requesting workspace's schema
   - Allowlist of functions (no `pg_read_file`, `COPY`, etc.)
   - No subqueries that reference other schemas
3. Validated query is executed via a connection authenticated as `ai_query_role`
4. Results are returned to the API route, never stored
5. If execution exceeds 10s, Postgres kills it (statement_timeout)

### What the AI sees

The AI receives a description of the dataset (schema_name, table_name, column names
and semantic types). It does NOT receive actual row data when generating SQL.

## Data flow

```
Browser → API Route → Service Layer → Supabase (public schema)
                    ↘ adminClient  → ws_* schema (datasets)
                    ↘ Anthropic    → AI parse/propose
```

## Key files

| File | Purpose |
|---|---|
| `middleware.ts` | Auth session refresh + route protection |
| `lib/supabase/admin.ts` | Service role client — never in browser |
| `lib/ai/client.ts` | All Anthropic calls — logs tokens + cost |
| `lib/ai/embeddings.ts` | Single embedding function — swap provider here |
| `lib/csv/parser.ts` | CSV → typed rows + column inference |
| `supabase/migrations/003_workspace_schema.sql` | `create_workspace_schema` and `ai_query_role` |

## Embedding provider decision

Using OpenAI `text-embedding-3-small` ($0.02/1M tokens).
All embedding calls go through `lib/ai/embeddings.ts`.
To swap to Voyage AI or another provider: change one file.

## File upload size limit

Vercel API routes have a 4.5MB request body limit.
For files over ~4MB: client uploads directly to Supabase Storage,
API route reads from Storage rather than the request body.
Slice 1 handles small files inline. Slice 1.5 adds the Storage upload path.
