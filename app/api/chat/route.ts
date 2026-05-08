import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { anthropic } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat"
import { validateKpiSql } from "@/lib/sql/validator"
import type { ColumnMetadata } from "@/lib/types"

// Tool definition is fully static — mark for KV-cache
const QUERY_TOOL: Anthropic.Tool = {
  name: "query_data",
  description:
    "Run a SQL SELECT query against the client's business data to retrieve numbers, trends, or facts needed to answer a question. Use this whenever precision matters — never guess when you can query.",
  input_schema: {
    type: "object" as const,
    properties: {
      sql: {
        type: "string",
        description:
          "A valid PostgreSQL SELECT query. Must be SELECT only. Double-quote schema and table names.",
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
    industry: workspace.industry,
    currency: workspace.primary_currency,
    datasets: (datasets ?? []).map((d) => ({
      name: d.name,
      schemaName: workspace.schema_name,
      tableName: d.table_name,
      aiDescription: d.ai_description,
      columns: (d.column_metadata ?? []) as ColumnMetadata[],
    })),
  })

  // Stable system prompt as cacheable block — hits KV-cache across turns & conversations
  const systemBlock: Anthropic.TextBlockParam[] = [
    { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
  ]

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  ;(async () => {
    const send = (type: string, data: Record<string, unknown> = {}) =>
      writer.write(sseChunk(type, data))

    try {
      let history = [...messages]

      for (let i = 0; i < 5; i++) {
        const isLastIteration = i === 4

        // Non-streaming for tool-use iterations; stream the final text response
        if (isLastIteration || history[history.length - 1]?.role === "user") {
          // Try streaming first — if tool_use comes back we'll handle it in next loop
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: systemBlock,
            tools: [QUERY_TOOL],
            messages: history,
          })

          let fullText = ""
          let stopReason: string | null = null
          let fullContent: Anthropic.ContentBlock[] = []

          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const chunk = event.delta.text
              fullText += chunk
              await send("text", { chunk })
            }
            if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? null
            }
          }

          const finalMsg = await stream.finalMessage()
          fullContent = finalMsg.content
          stopReason = finalMsg.stop_reason

          if (stopReason === "tool_use") {
            // Streamed partial text before tool call — discard streamed chunks,
            // they'll be regenerated after tool results are appended
            history.push({ role: "assistant", content: fullContent })
            const results: Anthropic.ToolResultBlockParam[] = []

            for (const block of fullContent) {
              if (block.type !== "tool_use") continue
              const input = block.input as { sql: string; reason: string }
              await send("status", { message: `Querying: ${input.reason}` })
              const { rows, error } = await runQuery(input.sql)
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: error
                  ? `Error: ${error}`
                  : rows.length === 0
                  ? "Query returned no rows."
                  : JSON.stringify(rows.slice(0, 100)),
              })
            }

            history.push({ role: "user", content: results })
            await send("status", { message: "Analyzing results…" })
            continue
          }

          // End of stream without tool use = final answer delivered
          await send("status", { message: null })
          break
        }
      }

      await send("done", {})
    } catch (e) {
      await send("error", { message: String(e) })
    }

    await writer.close()
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
