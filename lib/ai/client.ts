import Anthropic from "@anthropic-ai/sdk"
import { adminClient } from "@/lib/supabase/admin"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Pricing per 1M tokens (USD) — update when Anthropic changes rates
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 0.25, output: 1.25 },
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
  const model = options.model ?? "claude-sonnet-4-5"
  const maxTokens = options.maxTokens ?? 2048

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""

  // Log usage — best-effort, don't fail the request if logging fails
  const pricing = PRICING[model]
  const cost = pricing
    ? (response.usage.input_tokens / 1_000_000) * pricing.input +
      (response.usage.output_tokens / 1_000_000) * pricing.output
    : null

  void adminClient
    .from("ai_usage_log")
    .insert({
      workspace_id: options.workspaceId ?? null,
      model,
      endpoint: options.endpoint,
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      cost_usd: cost,
    })

  return text
}
