import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { slugify, workspaceSchemaName } from "@/lib/utils"

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().optional(),
  size: z.string().optional(),
  primary_currency: z.string().length(3).default("USD"),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = CreateWorkspaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, industry, size, primary_currency } = parsed.data

  // Generate the workspace ID upfront so we can derive schema_name in one step
  const workspaceId = crypto.randomUUID()
  const schemaName = workspaceSchemaName(workspaceId)

  // Generate a unique slug
  const baseSlug = slugify(name) || "workspace"
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await adminClient
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // Create the Postgres schema first (so if it fails, we don't create a workspace row)
  const { error: schemaError } = await adminClient.rpc(
    "create_workspace_schema",
    { p_schema_name: schemaName }
  )
  if (schemaError) {
    return NextResponse.json(
      { error: `Failed to create workspace schema: ${schemaError.message}` },
      { status: 500 }
    )
  }

  // Insert workspace row with the known ID and schema_name
  const { data: workspace, error: wsError } = await adminClient
    .from("workspaces")
    .insert({
      id: workspaceId,
      name,
      slug,
      industry: industry ?? null,
      size: size ?? null,
      primary_currency,
      owner_id: user.id,
      schema_name: schemaName,
    })
    .select()
    .single()

  if (wsError || !workspace) {
    return NextResponse.json({ error: `Failed to create workspace: ${wsError?.message}` }, { status: 500 })
  }

  // Add owner as member
  await adminClient.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  })

  return NextResponse.json({ workspace })
}
