import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { anthropic } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat"
import { validateKpiSql } from "@/lib/sql/validator"
import { maybeCompact } from "@/lib/ai/compaction"
import type { ColumnMetadata } from "@/lib/types"

// Route simple questions to Haiku (10× cheaper), complex analysis to Sonnet
const SIMPLE_PATTERN = /^(what is|what's|how much|who is|when did|show me|list|give me|tell me)/i
const NEEDS_TOOLS    = /compare|analyz|trend|breakdown|top \d|rank|strateg|forecast|why|how (is|are|should|can)/i

function selectModel(lastUserMessage: string): string {
  if (NEEDS_TOOLS.test(lastUserMessage))   return "claude-sonnet-4-6"
  if (SIMPLE_PATTERN.test(lastUserMessage)) return "claude-haiku-4-5-20251001"
  return "claude-sonnet-4-6" // default to Sonnet for quality
}

// Tool definition is fully static — marked for KV-cache
const QUERY_TOOL: Anthropic.Tool = {
  name: "query_data",
  description:
    "Run a SQL SELECT query against the client's business data to retrieve numbers, trends, or facts needed to answer a question. Use this whenever precision matters — never guess when you can query.",
  input_schema: {
    type: "object" as const,
    properties: {
      sql: {
        type: "string",
        description: "A valid PostgreSQL SELECT query. Must be SELECT only. Double-quote schema and table names.",
      },
      reason: {
        type: "string",
        description: "One sentence: what you are looking up and why.",
      },
    },
    required: ["sql", "reason"],
  },
  cache_control: { type: "ephemeral" },
}

async function runQuery(sql: string): Promise<{ rows: unknown[]; error?: string }> {
  const v = validateKpiSql(sql)
  if (!v.valid) return { rows: [], error: v.error }
  const { data, error } = await adminClient.rpc("run_kpi_query", { p_sql: sql })
  if (error) return { rows: [], error: error.message }
  return { rows: Array.isArray(data) ? data : [] }
}

function sseChunk(type: string, data: Record<string, unknown> = {}): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { workspace_id: string; messages: Anthropic.MessageParam[] }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { workspace_id, messages } = body
  if (!workspace_id || !messages?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from("workspace_members").select("role")
    .eq("workspace_id", workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [{ data: workspace }, { data: datasets }] = await Promise.all([
    adminClient.from("workspaces")
      .select("name, industry, primary_currency, schema_name")
      .eq("id", workspace_id).maybeSingle(),
    adminClient.from("datasets")
      .select("name, table_name, ai_description, column_metadata")
      .eq("workspace_id", workspace_id),
  ])
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

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

  // Stable system prompt cached by KV-cache across all turns/conversations
  const systemBlock: Anthropic.TextBlockParam[] = [
    { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
  ]

  // Select model based on question complexity, then apply compaction
  const lastUserText = (messages[messages.length - 1]?.content ?? "") as string
  const model        = selectModel(typeof lastUserText === "string" ? lastUserText : "")

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  ;(async () => {
    const send = (type: string, data: Record<string, unknown> = {}) =>
      writer.write(sseChunk(type, data))

    try {
      // Compact history if it's grown large — slides the window cheaply via Haiku
      let history = await maybeCompact(messages)

      for (let i = 0; i < 5; i++) {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: 2048,
          system:     systemBlock,
          tools:      [QUERY_TOOL],
          messages:   history,
        })

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            await send("text", { chunk: event.delta.text })
          }
        }

        const finalMsg  = await stream.finalMessage()
        const stopReason = finalMsg.stop_reason

        if (stopReason === "tool_use") {
          history.push({ role: "assistant", content: finalMsg.content })
          const results: Anthropic.ToolResultBlockParam[] = []

          for (const block of finalMsg.content) {
            if (block.type !== "tool_use") continue
            const input = block.input as { sql: string; reason: string }
            await send("status", { message: `Querying: ${input.reason}` })
            const { rows, error } = await runQuery(input.sql)

            // Compress large results — only send top 50 rows, not 100, to keep token count down
            const resultContent = error
              ? `Error: ${error}`
              : rows.length === 0
              ? "Query returned no rows."
              : JSON.stringify(rows.slice(0, 50))

            results.push({ type: "tool_result", tool_use_id: block.id, content: resultContent })
          }

          history.push({ role: "user", content: results })
          await send("status", { message: "Analyzing results…" })
          continue
        }

        // Final answer streamed — done
        await send("status", { message: null })
        break
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
