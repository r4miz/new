import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { validateHubSpotToken, fetchHubSpotDeals } from "@/lib/integrations/hubspot"
import { runSync } from "@/lib/integrations/sync-engine"

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspace_id, access_token, dataset_name } = await request.json()
  if (!workspace_id || !access_token) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const { data: membership } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const name = dataset_name || "HubSpot Deals"

  try { await validateHubSpotToken(access_token) }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 400 }) }

  const { data: integration, error: intErr } = await adminClient.from("integrations").insert({
    workspace_id, provider: "hubspot", name, status: "pending",
    credentials: { access_token },
    config: {},
  }).select().single()
  if (intErr || !integration) return NextResponse.json({ error: intErr?.message }, { status: 500 })

  try {
    const data = await fetchHubSpotDeals({ accessToken: access_token, datasetName: name })
    await runSync({ workspaceId: workspace_id, integrationId: integration.id, data, existingDatasetId: null })
    await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", integration.id)
  } catch (e) {
    await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", integration.id)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  return NextResponse.json({ integration })
}
