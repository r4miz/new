import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat"
import { validateKpiSql } from "@/lib/sql/validator"
import type { ColumnMetadata } from "@/lib/types"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  // Run the agentic loop asynchronously
  ;(async () => {
    const send = (type: string, data: Record<string, unknown> = {}) =>
      writer.write(sseChunk(type, data))

    try {
      let history = [...messages]

      for (let i = 0; i < 5; i++) {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          tools: [QUERY_TOOL],
          messages: history,
        })

        if (response.stop_reason === "tool_use") {
          history.push({ role: "assistant", content: response.content })
          const results: Anthropic.ToolResultBlockParam[] = []

          for (const block of response.content) {
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

        // Final answer — stream word-by-word for typing effect
        await send("status", { message: null })
        const textBlock = response.content.find((b) => b.type === "text")
        const text = textBlock?.type === "text" ? textBlock.text : ""

        const tokens = text.split(/(\s+)/)
        for (const token of tokens) {
          await send("text", { chunk: token })
          if (token.trim().length > 0) await new Promise((r) => setTimeout(r, 7))
        }
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
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
