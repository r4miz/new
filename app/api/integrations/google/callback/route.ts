import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { exchangeGoogleCode, extractSheetId, fetchGoogleSheet } from "@/lib/integrations/google-sheets"
import { runSync } from "@/lib/integrations/sync-engine"

export const maxDuration = 60

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/error?msg=Google+auth+denied`)
  }

  let parsed: { workspace_id: string; sheet_url: string; dataset_name: string }
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/error?msg=Invalid+state`)
  }

  const { workspace_id, sheet_url, dataset_name } = parsed

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members").select("role")
    .eq("workspace_id", workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data: workspace } = await adminClient.from("workspaces").select("slug").eq("id", workspace_id).single()
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  // Exchange code for tokens
  let credentials
  try {
    credentials = await exchangeGoogleCode(code)
  } catch (e) {
    return NextResponse.redirect(`${appUrl}/w/${workspace.slug}/integrations?error=${encodeURIComponent(String(e))}`)
  }

  const sheetId = extractSheetId(sheet_url)

  // Create integration record
  const { data: integration, error: intErr } = await adminClient.from("integrations").insert({
    workspace_id,
    provider:    "google_sheets",
    name:        dataset_name,
    status:      "pending",
    credentials,
    config:      { sheet_id: sheetId, sheet_url },
  }).select().single()

  if (intErr || !integration) {
    return NextResponse.redirect(`${appUrl}/w/${workspace.slug}/integrations?error=DB+error`)
  }

  // Run initial sync
  try {
    const data = await fetchGoogleSheet({
      integrationId: integration.id,
      credentials,
      sheetId,
      datasetName: dataset_name,
    })
    await runSync({ workspaceId: workspace_id, integrationId: integration.id, data, existingDatasetId: null })
    await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", integration.id)
  } catch (e) {
    await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", integration.id)
    return NextResponse.redirect(`${appUrl}/w/${workspace.slug}/integrations?error=${encodeURIComponent(String(e))}`)
  }

  return NextResponse.redirect(`${appUrl}/w/${workspace.slug}/integrations?connected=google`)
}
