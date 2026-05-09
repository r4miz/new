import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"

// GET — load messages for a session
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 })

  const { data: session } = await adminClient
    .from("chat_sessions").select("id").eq("id", sessionId).eq("user_id", user.id).maybeSingle()
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: messages } = await adminClient
    .from("chat_messages").select("role, content").eq("session_id", sessionId).order("created_at", { ascending: true })

  return NextResponse.json({ messages: messages ?? [] })
}

// POST — create session or save messages
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // Create new session
  if (body.action === "create") {
    const { workspace_id, title } = body
    const { data, error } = await adminClient.from("chat_sessions").insert({
      workspace_id, user_id: user.id, title: title ?? "New conversation",
    }).select("id, title, updated_at").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
  }

  // Save messages to session
  if (body.action === "save_messages") {
    const { session_id, messages } = body
    const { data: session } = await adminClient
      .from("chat_sessions").select("id").eq("id", session_id).eq("user_id", user.id).maybeSingle()
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const rows = messages.map((m: { role: string; content: string }) => ({
      session_id, role: m.role, content: m.content,
    }))
    await adminClient.from("chat_messages").insert(rows)
    return NextResponse.json({ ok: true })
  }

  // Update session title
  if (body.action === "rename") {
    const { session_id, title } = body
    await adminClient.from("chat_sessions").update({ title })
      .eq("id", session_id).eq("user_id", user.id)
    return NextResponse.json({ ok: true })
  }

  // Delete session
  if (body.action === "delete") {
    const { session_id } = body
    await adminClient.from("chat_sessions").delete()
      .eq("id", session_id).eq("user_id", user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
