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

  // Workspace row
  const { data: workspace, error: wsError } = await adminClient
    .from("workspaces")
    .insert({
      name,
      slug,
      industry: industry ?? null,
      size: size ?? null,
      primary_currency,
      owner_id: user.id,
      schema_name: workspaceSchemaName(
        // We need the ID, so insert first then create schema
        "placeholder"
      ),
    })
    .select()
    .single()

  // We need the real ID for the schema name — do it in two steps
  const workspaceId = workspace?.id
  if (wsError || !workspaceId) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }

  const schemaName = workspaceSchemaName(workspaceId)

  // Update the schema_name with the real ID
  await adminClient
    .from("workspaces")
    .update({ schema_name: schemaName })
    .eq("id", workspaceId)

  // Create the Postgres schema via the DB function (SECURITY DEFINER)
  const { error: schemaError } = await adminClient.rpc(
    "create_workspace_schema",
    { p_schema_name: schemaName }
  )
  if (schemaError) {
    // Roll back workspace creation if schema fails
    await adminClient.from("workspaces").delete().eq("id", workspaceId)
    return NextResponse.json({ error: "Failed to create workspace schema" }, { status: 500 })
  }

  // Add owner as member
  await adminClient.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  })

  return NextResponse.json({ workspace: { ...workspace, schema_name: schemaName, slug } })
}
