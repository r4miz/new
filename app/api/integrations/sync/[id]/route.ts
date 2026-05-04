import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { fetchGoogleSheet, extractSheetId } from "@/lib/integrations/google-sheets"
import { fetchShopifyOrders } from "@/lib/integrations/shopify"
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
  if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 })

  const { data: membership } = await supabase
    .from("workspace_members").select("role")
    .eq("workspace_id", integration.workspace_id).eq("user_id", user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const intg = integration as Integration

  try {
    let data
    if (intg.provider === "google_sheets") {
      const creds  = intg.credentials as { access_token: string; refresh_token: string; expires_at: number }
      const config = intg.config as { sheet_id: string }
      data = await fetchGoogleSheet({ integrationId: intg.id, credentials: creds, sheetId: config.sheet_id, datasetName: intg.name })
    } else if (intg.provider === "shopify") {
      const creds  = intg.credentials as { shop_domain: string; access_token: string }
      data = await fetchShopifyOrders({ shopDomain: creds.shop_domain, accessToken: creds.access_token, datasetName: intg.name })
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    await runSync({ workspaceId: intg.workspace_id, integrationId: intg.id, data, existingDatasetId: intg.dataset_id })
    await adminClient.from("integrations").update({ status: "active", last_synced_at: new Date().toISOString(), last_error: null }).eq("id", id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    await adminClient.from("integrations").update({ status: "error", last_error: String(e) }).eq("id", id)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
