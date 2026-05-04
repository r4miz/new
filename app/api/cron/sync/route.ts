import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase/admin"
import { fetchGoogleSheet } from "@/lib/integrations/google-sheets"
import { fetchShopifyOrders } from "@/lib/integrations/shopify"
import { runSync } from "@/lib/integrations/sync-engine"
import type { Integration } from "@/lib/integrations/types"

export const maxDuration = 300

export async function GET(request: Request) {
  // Vercel cron sends Authorization: Bearer {CRON_SECRET}
  const auth = request.headers.get("Authorization")
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: integrations } = await adminClient
    .from("integrations")
    .select("*")
    .eq("status", "active")
    .neq("sync_frequency", "manual")

  if (!integrations?.length) return NextResponse.json({ synced: 0 })

  const now     = Date.now()
  const results = { synced: 0, errors: 0 }

  for (const row of integrations) {
    const intg = row as Integration

    // Check if due
    const freq        = intg.sync_frequency === "weekly" ? 7 * 86_400_000 : 86_400_000
    const lastSynced  = intg.last_synced_at ? new Date(intg.last_synced_at).getTime() : 0
    if (now - lastSynced < freq) continue

    try {
      let data
      if (intg.provider === "google_sheets") {
        const creds  = intg.credentials as { access_token: string; refresh_token: string; expires_at: number }
        const config = intg.config as { sheet_id: string }
        data = await fetchGoogleSheet({ integrationId: intg.id, credentials: creds, sheetId: config.sheet_id, datasetName: intg.name })
      } else {
        const creds = intg.credentials as { shop_domain: string; access_token: string }
        data = await fetchShopifyOrders({ shopDomain: creds.shop_domain, accessToken: creds.access_token, datasetName: intg.name })
      }

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
