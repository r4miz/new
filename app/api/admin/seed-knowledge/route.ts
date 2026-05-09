import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase/admin"
import { KNOWLEDGE_CHUNKS } from "@/lib/ai/knowledge/chunks"

// Protect with a secret — set SEED_SECRET in env vars and pass as ?secret=xxx
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Clear existing chunks and re-seed (idempotent)
  const { error: deleteErr } = await adminClient.from("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const { error: insertErr } = await adminClient
    .from("knowledge_chunks")
    .insert(KNOWLEDGE_CHUNKS.map(c => ({
      title:    c.title,
      source:   c.source,
      category: c.category,
      industry: c.industry,
      content:  c.content,
    })))

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ seeded: KNOWLEDGE_CHUNKS.length, message: "Knowledge base seeded successfully." })
}
