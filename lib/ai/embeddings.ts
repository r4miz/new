import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MODEL = "text-embedding-3-small"

/**
 * Single entry point for all embedding calls.
 * Swap the provider here without touching any call sites.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await openai.embeddings.create({
    model: MODEL,
    input: texts,
    encoding_format: "float",
  })

  return response.data.map((d) => d.embedding)
}

export async function embedOne(text: string): Promise<number[]> {
  const results = await embed([text])
  return results[0]
}
