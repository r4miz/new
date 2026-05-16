import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { anthropic } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat"
import { validateKpiSql } from "@/lib/sql/validator"
import { maybeCompact } from "@/lib/ai/compaction"
import { isActive } from "@/lib/billing"
import type { ColumnMetadata } from "@/lib/types"

// ── Model routing ────────────────────────────────────────────────────────────
// Complex analysis → Sonnet; simple factual → Haiku (10× cheaper)
const COMPLEX = /compare|analyz|strateg|forecast|benchmark|trend|breakdown|top \d|rank|why|how (is|are|should|can)|hormozi|recommend|advise|improve/i

function selectModel(lastMsg: string): string {
  return COMPLEX.test(lastMsg) ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001"
}

// ── Tool definitions (all three marked for KV-cache on the last one) ─────────
const QUERY_TOOL: Anthropic.Tool = {
  name: "query_data",
  description: "Run a SQL SELECT against the client's business data to get specific numbers, trends, or facts. Use when the question requires their actual data. Never guess numbers you can query.",
  input_schema: {
    type: "object" as const,
    properties: {
      sql:    { type: "string", description: "Valid PostgreSQL SELECT. Must be SELECT only. Double-quote schema and table names." },
      reason: { type: "string", description: "One sentence: what you are looking up and why." },
    },
    required: ["sql", "reason"],
  },
}

const SEARCH_KNOWLEDGE_TOOL: Anthropic.Tool = {
  name: "search_knowledge",
  description: "Search a curated business knowledge base containing Alex Hormozi frameworks ($100M Offers, $100M Leads, Gym Launch), top business books (Good to Great, Zero to One, Traction, E-Myth, Profit First, Start with Why, Built to Last, Never Split the Difference, Lean Startup, 4-Hour Workweek), and industry benchmarks for SaaS, e-commerce, restaurants, professional services, retail, fitness, agencies, and general SMB. Use when the user asks for advice, frameworks, benchmarks, growth strategies, pricing help, or how to improve their business.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "What to search for. Be specific: 'Hormozi pricing psychology', 'SaaS churn benchmarks', 'how to construct a grand slam offer', 'profit first cash allocation percentages'." },
    },
    required: ["query"],
  },
}

const CREATE_KPI_TOOL: Anthropic.Tool = {
  name: "create_kpi",
  description: "Create a new KPI tile on the client's dashboard. Use ONLY when the client explicitly asks to 'add', 'create', 'save', 'track', or 'put on my dashboard' a specific metric. Do not use proactively.",
  input_schema: {
    type: "object" as const,
    properties: {
      name:        { type: "string",  description: "Short KPI name, 2-5 words. e.g. 'Monthly Revenue Trend'" },
      description: { type: "string",  description: "What this measures and why it matters, 1-2 sentences." },
      sql:         { type: "string",  description: "Valid PostgreSQL SELECT query that returns the data for this KPI." },
      chart_type:  { type: "string",  enum: ["line", "area", "bar", "number"], description: "Best chart type for this data." },
    },
    required: ["name", "description", "sql", "chart_type"],
  },
  // Last tool — cache_control caches all three tool definitions
  cache_control: { type: "ephemeral" },
}

const TOOLS: Anthropic.Tool[] = [QUERY_TOOL, SEARCH_KNOWLEDGE_TOOL, CREATE_KPI_TOOL]

// ── Helpers ───────────────────────────────────────────────────────────────────
async function runQuery(sql: string): Promise<{ rows: unknown[]; error?: string }> {
  const v = validateKpiSql(sql)
  if (!v.valid) return { rows: [], error: v.error }
  const { data, error } = await adminClient.rpc("run_kpi_query", { p_sql: sql })
  if (error) return { rows: [], error: error.message }
  return { rows: Array.isArray(data) ? data : [] }
}

async function searchKnowledge(query: string): Promise<string> {
  const { data, error } = await adminClient
    .from("knowledge_chunks")
    .select("title, source, content")
    .textSearch("search_vector", query.split(" ").join(" | "), { type: "plain" })
    .limit(4)

  if (error || !data?.length) {
    return "No specific knowledge found for this query. Answer from your general expertise."
  }

  return data.map((c, i) =>
    `[${i + 1}] ${c.title}\nSource: ${c.source}\n${c.content}`
  ).join("\n\n---\n\n")
}

async function createKpi(
  input: { name: string; description: string; sql: string; chart_type: string },
  workspaceId: string,
  datasets: Array<{ id: string; table_name: string }>
): Promise<string> {
  const v = validateKpiSql(input.sql)
  if (!v.valid) return `Cannot create KPI — invalid SQL: ${v.error}`

  // Match dataset from the SQL (look for the table name referenced)
  const datasetId = datasets.find(d =>
    input.sql.toLowerCase().includes(d.table_name.toLowerCase())
  )?.id ?? datasets[0]?.id

  if (!datasetId) return "Cannot create KPI — no datasets found. Please upload data first."

  const { error } = await adminClient.from("kpi_proposals").insert({
    workspace_id:  workspaceId,
    dataset_id:    datasetId,
    name:          input.name,
    description:   input.description,
    proposed_sql:  input.sql,
    chart_type:    input.chart_type,
  })

  if (error) return `Failed to create KPI: ${error.message}`
  return `✓ KPI "${input.name}" has been added to your dashboard. Go to the Dashboard tab to see it.`
}

function sseChunk(type: string, data: Record<string, unknown> = {}): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { workspace_id: string; messages: Anthropic.MessageParam[] }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { workspace_id, messages } = body
  if (!workspace_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  if (!Array.isArray(messages) || messages.length > 50) {
    return NextResponse.json({ error: "messages must be an array of at most 50 items" }, { status: 400 })
  }
  for (const msg of messages) {
    if ((msg.role !== "user" && msg.role !== "assistant") ||
        typeof msg.content !== "string" ||
        (msg.content as string).length > 20000) {
      return NextResponse.json({ error: "Invalid message entry" }, { status: 400 })
    }
  }

  const { data: membership } = await supabase
    .from("workspace_members").select("role")
    .eq("workspace_id", workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [{ data: workspace }, { data: datasets }] = await Promise.all([
    adminClient.from("workspaces")
      .select("name, industry, primary_currency, schema_name, subscription_status, trial_ends_at")
      .eq("id", workspace_id).maybeSingle(),
    adminClient.from("datasets")
      .select("id, name, table_name, ai_description, column_metadata")
      .eq("workspace_id", workspace_id),
  ])
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  if (!isActive(workspace.subscription_status, workspace.trial_ends_at)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 })
  }

  const systemPrompt = buildChatSystemPrompt({
    workspaceName: workspace.name,
    industry:      workspace.industry,
    currency:      workspace.primary_currency,
    datasets: (datasets ?? []).map(d => ({
      name:          d.name,
      schemaName:    workspace.schema_name,
      tableName:     d.table_name,
      aiDescription: d.ai_description,
      columns:       (d.column_metadata ?? []) as ColumnMetadata[],
    })),
  })

  // Stable system prompt — KV-cached across turns and conversations
  const systemBlock: Anthropic.TextBlockParam[] = [
    { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
  ]

  // Dataset list for create_kpi handler
  const datasetList = (datasets ?? []).map(d => ({ id: d.id, table_name: d.table_name }))

  // Model routing based on question complexity
  const lastContent = messages[messages.length - 1]?.content
  const lastText    = typeof lastContent === "string" ? lastContent : ""
  const model       = selectModel(lastText)

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  ;(async () => {
    const send = (type: string, data: Record<string, unknown> = {}) =>
      writer.write(sseChunk(type, data))

    try {
      // Sliding window compaction — keeps context lean on long conversations
      let history = await maybeCompact(messages)

      for (let i = 0; i < 4; i++) {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: 1200,
          system:     systemBlock,
          tools:      TOOLS,
          messages:   history,
        })

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            await send("text", { chunk: event.delta.text })
          }
        }

        const finalMsg  = await stream.finalMessage()
        const stopReason = finalMsg.stop_reason

        if (stopReason !== "tool_use") {
          await send("status", { message: null })
          break
        }

        // Handle all tool calls in this turn
        history.push({ role: "assistant", content: finalMsg.content })
        const results: Anthropic.ToolResultBlockParam[] = []

        for (const block of finalMsg.content) {
          if (block.type !== "tool_use") continue

          if (block.name === "query_data") {
            const input = block.input as { sql: string; reason: string }
            await send("status", { message: `Querying: ${input.reason}` })
            const { rows, error } = await runQuery(input.sql)
            results.push({
              type: "tool_result", tool_use_id: block.id,
              content: error ? `Error: ${error}`
                : rows.length === 0 ? "Query returned no rows."
                : JSON.stringify(rows.slice(0, 50)),
            })
          }

          else if (block.name === "search_knowledge") {
            const input = block.input as { query: string }
            await send("status", { message: `Searching knowledge base…` })
            const result = await searchKnowledge(input.query)
            results.push({ type: "tool_result", tool_use_id: block.id, content: result })
          }

          else if (block.name === "create_kpi") {
            const input = block.input as { name: string; description: string; sql: string; chart_type: string }
            await send("status", { message: `Creating KPI: ${input.name}…` })
            const result = await createKpi(input, workspace_id, datasetList)
            results.push({ type: "tool_result", tool_use_id: block.id, content: result })
          }
        }

        history.push({ role: "user", content: results })
        await send("status", { message: "Analyzing…" })
      }

      await send("done", {})
    } catch (e) {
      await send("error", { message: String(e) })
    }

    await writer.close()
  })()

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection:      "keep-alive",
    },
  })
}
