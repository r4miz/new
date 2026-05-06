import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"

const UpdateSchema = z.object({
  name:             z.string().min(1).max(100).optional(),
  industry:         z.string().max(100).optional(),
  size:             z.string().optional(),
  primary_currency: z.string().length(3).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: membership } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", id).eq("user_id", user.id).maybeSingle()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data: workspace, error } = await adminClient.from("workspaces")
    .update(parsed.data).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workspace })
}
