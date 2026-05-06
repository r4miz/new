import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase/admin"
import { fetchGoogleSheet } from "@/lib/integrations/google-sheets"
import { fetchShopifyOrders } from "@/lib/integrations/shopify"
import { fetchWooOrders } from "@/lib/integrations/woocommerce"
import { fetchHubSpotDeals } from "@/lib/integrations/hubspot"
import { fetchStripePayments } from "@/lib/integrations/stripe-data"
import { fetchAirtableRecords } from "@/lib/integrations/airtable"
import { runSync } from "@/lib/integrations/sync-engine"
import type { Integration } from "@/lib/integrations/types"

export const maxDuration = 300

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization")
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: integrations } = await adminClient
    .from("integrations").select("*")
    .eq("status", "active").neq("sync_frequency", "manual")

  if (!integrations?.length) return NextResponse.json({ synced: 0 })

  const now     = Date.now()
  const results = { synced: 0, errors: 0 }

  for (const row of integrations) {
    const intg = row as Integration
    const freq = intg.sync_frequency === "weekly" ? 7 * 86_400_000 : 86_400_000
    if (now - (intg.last_synced_at ? new Date(intg.last_synced_at).getTime() : 0) < freq) continue

    try {
      const data = await fetchForProvider(intg)
      await runSync({ workspaceId: intg.workspace_id, integrationId: intg.id, data, existingDatasetId: intg.dataset_id })
      await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", intg.id)
      results.synced++
    } catch (e) {
      await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", intg.id)
      results.errors++
    }
  }

  return NextResponse.json(results)
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
