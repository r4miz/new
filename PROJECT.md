# Slice Plan

## Slice 1 — Core data flow (current) ✅
- Supabase Auth (email/password signup + login)
- Workspace creation → `ws_*` Postgres schema provisioned
- CSV upload → parsed → stored in workspace schema table
- AI parses dataset: infers column semantic types, writes description
- AI proposes one KPI: name, description, SQL (shown as text only — not executed)
- Dashboard tile renders the proposal

**Deliberately excluded:**
- SQL execution (no real numbers, no sparklines)
- Stripe billing
- Chatbot/RAG
- Error handling beyond happy path

## Slice 1.5 — SQL sandbox + live tiles
- `ai_query_role` Postgres role plumbed end to end
- SQL validator: real parser, allowlist, workspace-scope enforcement
- Execute AI-generated SQL as `ai_query_role`
- KPI tile graduates: shows headline number + sparkline (Recharts)
- Drill-in view: underlying data rows, paginated
- Statement timeout handling + user-friendly error states
- RLS isolation tests: verify workspace A cannot read workspace B's data

## Slice 2 — Stripe billing
- Stripe Checkout for subscription (Starter/Growth/Scale plans)
- 14-day free trial countdown
- Paywall middleware: block product routes when trial expired
- Stripe Customer Portal for self-serve billing changes
- Webhook handler: sync subscription status to `workspaces` table
- Trial expiration email flow (30-day data preservation)

## Slice 3 — AI chatbot + RAG
- Document upload: PDF, DOCX, TXT → chunked → embedded (text-embedding-3-small)
- pgvector storage of embeddings, keyed by workspace
- Chat UI with streaming responses
- Retrieval: embed user query → similarity search → inject top-k chunks as context
- Structured data tool: chatbot can write + execute SQL via the same sandbox
- Citation requirement: every response cites source documents and/or tables
- Chat history persisted per workspace per user

## Slice 4 — Integrations
- Stripe data source (OAuth → pull payments/customers/subscriptions)
- Google Sheets data source (OAuth → pull from chosen sheet)
- Nightly refresh: re-run KPI queries, update sparkline data
- Vercel Cron for scheduling

## Out of scope (current decisions)
- Mobile app
- Multi-language
- SSO / SAML / SCIM
- Custom report builder
- Real-time streaming data
- Workflow automation / alerts
