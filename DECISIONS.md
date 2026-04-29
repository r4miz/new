# Architectural Decisions

## 2026-04-29 — Embedding provider: OpenAI text-embedding-3-small
**Decision:** OpenAI `text-embedding-3-small` over Voyage AI.
**Rationale:** One fewer API vendor, $0.02/1M tokens (cheap), supported by every RAG
library, swappable in one file (`lib/ai/embeddings.ts`). Voyage AI has marginally better
retrieval quality but the difference only matters at scale.
**Revisit if:** Chatbot retrieval quality is poor on real documents at scale.

## 2026-04-29 — Workspace-per-schema isolation
**Decision:** Each workspace gets its own Postgres schema (`ws_{id}`).
**Rationale:** Cleaner isolation than RLS on a shared schema. The AI SQL sandbox only
needs to know one schema name — cross-workspace access is structurally impossible.
Cleanup on workspace deletion is a single `DROP SCHEMA CASCADE`.
**Trade-off:** Dynamic schema creation requires service role; Supabase Studio doesn't
show non-public schemas as prominently.

## 2026-04-29 — SQL validation: real parser not regex
**Decision:** Use a real SQL parser (pgsql-parser or pg-query-parser) to validate
AI-generated queries before execution.
**Rationale:** Regex-based SQL validation has been defeated by researchers trivially.
A real parser builds an AST; we walk the AST and reject anything that isn't a
workspace-scoped SELECT. More expensive to build but the only option that's actually
safe.
**Implementation:** Slice 1.5.

## 2026-04-29 — Background jobs: Vercel Cron (not Inngest) for MVP
**Decision:** Vercel Cron for nightly dashboard refresh. Inngest if jobs get complex.
**Rationale:** Zero infra setup, free tier covers daily refreshes for MVP scale.
Inngest is the right answer once jobs need retries, fan-out, or event triggers — but
that's slice 4+.

## 2026-04-29 — Slice 1 shows SQL, doesn't execute it
**Decision:** Slice 1 KPI tiles display the proposed SQL as text only.
**Rationale:** Validates AI proposal quality before building the execution sandbox.
If the AI proposes garbage SQL, we know before wiring up a query executor.
Building the sandbox correctly is a multi-day job; cramming it into slice 1 means
doing it badly.
**Slice:** 1.5 adds execution.

## 2026-04-29 — No HIPAA/SOC 2 for MVP
**Decision:** Explicitly out of scope. "Not for regulated data" notice at signup.
**Rationale:** Revenue first, compliance infrastructure second. Target customer is
SMBs with general business data, not healthcare or finance.
**Revisit if:** An enterprise customer requires it and is willing to pay for it.
