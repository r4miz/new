import type { RawSyncData } from "./types"

export async function validateHubSpotToken(accessToken: string): Promise<void> {
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals?limit=1", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`HubSpot validation failed (${res.status}). Check your private app access token.`)
}

export async function fetchHubSpotDeals(params: {
  accessToken: string
  datasetName: string
}): Promise<RawSyncData> {
  const { accessToken, datasetName } = params
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
  const deals: Record<string, string>[] = []
  let after: string | undefined

  while (true) {
    const url = new URL("https://api.hubapi.com/crm/v3/objects/deals")
    url.searchParams.set("limit", "100")
    url.searchParams.set("properties", "dealname,amount,closedate,dealstage,pipeline,hs_deal_stage_probability,createdate,hubspot_owner_id")
    if (after) url.searchParams.set("after", after)

    const res  = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`HubSpot deals API error: ${res.status}`)
    const json = await res.json()

    for (const deal of json.results ?? []) {
      const p = deal.properties ?? {}
      deals.push({
        deal_id:          deal.id,
        deal_name:        p.dealname ?? "",
        amount:           p.amount ?? "",
        close_date:       p.closedate ? p.closedate.slice(0, 10) : "",
        create_date:      p.createdate ? p.createdate.slice(0, 10) : "",
        stage:            p.dealstage ?? "",
        pipeline:         p.pipeline ?? "",
        probability:      p.hs_deal_stage_probability ?? "",
      })
    }

    after = json.paging?.next?.after
    if (!after) break
  }

  return {
    name: datasetName,
    headers: ["deal_id","deal_name","amount","close_date","create_date","stage","pipeline","probability"],
    rows: deals,
  }
}
