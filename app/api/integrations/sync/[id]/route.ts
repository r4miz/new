import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { fetchGoogleSheet } from "@/lib/integrations/google-sheets"
import { fetchShopifyOrders } from "@/lib/integrations/shopify"
import { fetchWooOrders } from "@/lib/integrations/woocommerce"
import { fetchHubSpotDeals } from "@/lib/integrations/hubspot"
import { fetchStripePayments } from "@/lib/integrations/stripe-data"
import { fetchAirtableRecords } from "@/lib/integrations/airtable"
import { runSync } from "@/lib/integrations/sync-engine"
import type { Integration } from "@/lib/integrations/types"

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: integration } = await adminClient.from("integrations").select("*").eq("id", id).maybeSingle()
  if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: membership } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", integration.workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const intg = integration as Integration

  try {
    const data = await fetchForProvider(intg)
    await runSync({ workspaceId: intg.workspace_id, integrationId: intg.id, data, existingDatasetId: intg.dataset_id })
    await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", id)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function fetchForProvider(intg: Integration) {
  const c = intg.credentials as Record<string, string>
  const f = intg.config     as Record<string, string>

  switch (intg.provider) {
    case "google_sheets":
      return fetchGoogleSheet({ integrationId: intg.id, credentials: c as unknown as Parameters<typeof fetchGoogleSheet>[0]["credentials"], sheetId: f.sheet_id, datasetName: intg.name })
    case "shopify":
      return fetchShopifyOrders({ shopDomain: c.shop_domain, accessToken: c.access_token, datasetName: intg.name })
    case "woocommerce":
      return fetchWooOrders({ storeUrl: c.store_url, consumerKey: c.consumer_key, consumerSecret: c.consumer_secret, datasetName: intg.name })
    case "hubspot":
      return fetchHubSpotDeals({ accessToken: c.access_token, datasetName: intg.name })
    case "stripe_data":
      return fetchStripePayments({ secretKey: c.secret_key, datasetName: intg.name })
    case "airtable":
      return fetchAirtableRecords({ token: c.token, baseId: f.base_id, tableId: f.table_id, datasetName: intg.name })
    default:
      throw new Error(`Unknown provider: ${intg.provider}`)
  }
}
