import type { RawSyncData } from "./types"

export function normaliseWooUrl(input: string): string {
  return input.replace(/\/$/, "").replace(/^(?!https?:\/\/)/, "https://")
}

export async function validateWooCredentials(storeUrl: string, consumerKey: string, consumerSecret: string): Promise<void> {
  const url = `${storeUrl}/wp-json/wc/v3/system_status`
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
  const res  = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
  if (!res.ok) throw new Error(`WooCommerce validation failed (${res.status}). Check your store URL and API keys.`)
}

export async function fetchWooOrders(params: {
  storeUrl:       string
  consumerKey:    string
  consumerSecret: string
  datasetName:    string
}): Promise<RawSyncData> {
  const { storeUrl, consumerKey, consumerSecret, datasetName } = params
  const auth    = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
  const headers = { Authorization: `Basic ${auth}` }
  const orders: Record<string, string>[] = []

  let page = 1
  while (true) {
    const res  = await fetch(`${storeUrl}/wp-json/wc/v3/orders?per_page=100&page=${page}&status=any`, { headers })
    if (!res.ok) throw new Error(`WooCommerce orders API error: ${res.status}`)
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break

    for (const o of batch) {
      orders.push({
        order_id:         String(o.id),
        status:           o.status,
        date_created:     o.date_created ? o.date_created.slice(0, 10) : "",
        customer_email:   o.billing?.email ?? "",
        customer_name:    `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim(),
        total:            o.total,
        subtotal:         o.subtotal ?? "",
        shipping_total:   o.shipping_total ?? "",
        payment_method:   o.payment_method_title ?? "",
        item_count:       String(o.line_items?.length ?? 0),
        products:         (o.line_items ?? []).map((i: { name: string }) => i.name).join(", "),
        currency:         o.currency,
      })
    }

    if (batch.length < 100) break
    page++
  }

  return {
    name: datasetName,
    headers: ["order_id","status","date_created","customer_email","customer_name","total","subtotal","shipping_total","payment_method","item_count","products","currency"],
    rows: orders,
  }
}
