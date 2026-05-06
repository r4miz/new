import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { normaliseWooUrl, validateWooCredentials, fetchWooOrders } from "@/lib/integrations/woocommerce"
import { runSync } from "@/lib/integrations/sync-engine"

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspace_id, store_url, consumer_key, consumer_secret, dataset_name } = await request.json()
  if (!workspace_id || !store_url || !consumer_key || !consumer_secret) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const { data: membership } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const storeUrl = normaliseWooUrl(store_url)
  const name     = dataset_name || "WooCommerce Orders"

  try { await validateWooCredentials(storeUrl, consumer_key, consumer_secret) }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 400 }) }

  const { data: integration, error: intErr } = await adminClient.from("integrations").insert({
    workspace_id, provider: "woocommerce", name, status: "pending",
    credentials: { store_url: storeUrl, consumer_key, consumer_secret },
    config: { store_url: storeUrl },
  }).select().single()
  if (intErr || !integration) return NextResponse.json({ error: intErr?.message }, { status: 500 })

  try {
    const data = await fetchWooOrders({ storeUrl, consumerKey: consumer_key, consumerSecret: consumer_secret, datasetName: name })
    await runSync({ workspaceId: workspace_id, integrationId: integration.id, data, existingDatasetId: null })
    await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", integration.id)
  } catch (e) {
    await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", integration.id)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  return NextResponse.json({ integration })
}
