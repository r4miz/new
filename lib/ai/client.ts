import Anthropic from "@anthropic-ai/sdk"
import { adminClient } from "@/lib/supabase/admin"

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Pricing per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-sonnet-4-6":         { input: 3.0,  output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  "claude-haiku-4-5-20251001": { input: 0.8,  output: 4.0,  cacheRead: 0.08, cacheWrite: 1.00 },
}

export interface AiCallOptions {
  model?: string
  maxTokens?: number
  workspaceId?: string
  endpoint: string
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: AiCallOptions
): Promise<string> {
  const model = options.model ?? "claude-sonnet-4-6"
  const maxTokens = options.maxTokens ?? 2048

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    // Cache the system prompt — static prompts hit cache on repeat calls within 5 min TTL
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""

  // Cost accounting: cached reads are 10% price, cache writes are 125% price
  const usage = response.usage as Anthropic.Usage & {
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
  const pricing = PRICING[model]
  const cacheRead   = usage.cache_read_input_tokens ?? 0
  const cacheWrite  = usage.cache_creation_input_tokens ?? 0
  const regularIn   = usage.input_tokens
  const cost = pricing
    ? (regularIn   / 1_000_000) * pricing.input  +
      (cacheRead   / 1_000_000) * pricing.cacheRead +
      (cacheWrite  / 1_000_000) * pricing.cacheWrite +
      (usage.output_tokens / 1_000_000) * pricing.output
    : null

  void adminClient.from("ai_usage_log").insert({
    workspace_id:       options.workspaceId ?? null,
    model,
    endpoint:           options.endpoint,
    prompt_tokens:      usage.input_tokens,
    completion_tokens:  usage.output_tokens,
    cost_usd:           cost,
  })

  return text
}
