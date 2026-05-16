import Anthropic from "@anthropic-ai/sdk"
import { anthropic } from "@/lib/ai/client"

// Rough token estimate: 1 token ≈ 4 chars. Fast, no API call needed.
export function estimateTokens(messages: Anthropic.MessageParam[]): number {
  const chars = messages.reduce((sum, m) => {
    if (typeof m.content === "string") return sum + m.content.length
    if (Array.isArray(m.content)) {
      return sum + m.content.reduce((s, block) => {
        if ("text" in block) return s + block.text.length
        if ("content" in block && typeof block.content === "string") return s + block.content.length
        return s
      }, 0)
    }
    return sum
  }, 0)
  return Math.ceil(chars / 4)
}

// Compact older messages into a structured summary using Haiku (cheap).
// Keeps the last KEEP_RECENT messages verbatim for fresh context.
const KEEP_RECENT     = 4   // messages to preserve verbatim
const COMPACT_TRIGGER = 1500 // estimated tokens before compacting

export async function maybeCompact(
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.MessageParam[]> {
  if (messages.length <= KEEP_RECENT) return messages
  if (estimateTokens(messages) <= COMPACT_TRIGGER) return messages

  const toCompact = messages.slice(0, messages.length - KEEP_RECENT)
  const toKeep    = messages.slice(messages.length - KEEP_RECENT)

  const historyText = toCompact
    .map(m => {
      const role = m.role === "user" ? "User" : "Assistant"
      const text = typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map(b => {
              if ("text" in b) return b.text
              if (b.type === "tool_use") return `[Ran query: ${JSON.stringify((b.input as any)?.reason ?? "")}]`
              if (b.type === "tool_result") {
                const raw = typeof b.content === "string" ? b.content : JSON.stringify(b.content)
                return `[Query result: ${raw.slice(0, 400)}${raw.length > 400 ? "…" : ""}]`
              }
              return ""
            }).filter(Boolean).join(" ")
          : ""
      return `${role}: ${text}`
    })
    .join("\n\n")

  const summaryRes = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: [{ type: "text", text: "You are a precise conversation summarizer for a business analytics assistant. Produce a compact structured summary.", cache_control: { type: "ephemeral" } }],
    messages: [{
      role: "user",
      content: `Summarize this business analytics conversation history. Be specific — preserve numbers, metric names, and query results.

${historyText}

Return ONLY this structure (no preamble):

## User's goal
[What the user is trying to understand or accomplish]

## Data queries & results
[For each query run: what was searched and the key numbers found]

## Key findings
[Bullet list of the most important facts and insights established]

## Established context
[Any decisions, preferences, or constraints the user mentioned]`,
    }],
  })

  const summaryText = summaryRes.content[0].type === "text" ? summaryRes.content[0].text : ""

  // Inject the summary as a synthetic exchange at the start of the kept window
  const summaryMessage: Anthropic.MessageParam = {
    role: "user",
    content: `[CONVERSATION SUMMARY — earlier messages compacted to save context]\n\n${summaryText}`,
  }
  const ackMessage: Anthropic.MessageParam = {
    role: "assistant",
    content: "Understood. I have the context from our earlier conversation and will continue from there.",
  }

  return [summaryMessage, ackMessage, ...toKeep]
}
