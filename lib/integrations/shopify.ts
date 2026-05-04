import type { RawSyncData } from "./types"

interface ShopifyOrder {
  id:                 number
  created_at:         string
  total_price:        string
  subtotal_price:     string
  financial_status:   string
  fulfillment_status: string | null
  customer?:          { first_name?: string; last_name?: string; email?: string }
  line_items:         Array<{ title: string; quantity: number; price: string }>
}

export function normaliseShopDomain(input: string): string {
  return input.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim()
}

export async function validateShopifyToken(shopDomain: string, accessToken: string): Promise<void> {
  const res = await fetch(
    `https://${shopDomain}/admin/api/2024-07/shop.json`,
    { headers: { "X-Shopify-Access-Token": accessToken } }
  )
  if (!res.ok) throw new Error(`Shopify validation failed (${res.status}). Check your store URL and access token.`)
}

export async function fetchShopifyOrders(params: {
  shopDomain:   string
  accessToken:  string
  datasetName:  string
}): Promise<RawSyncData> {
  const { shopDomain, accessToken, datasetName } = params
  const orders: ShopifyOrder[] = []

  let url: string | null =
    `https://${shopDomain}/admin/api/2024-07/orders.json?status=any&limit=250` +
    `&fields=id,created_at,total_price,subtotal_price,financial_status,fulfillment_status,customer,line_items`

  while (url) {
    const res: Response = await fetch(url, { headers: { "X-Shopify-Access-Token": accessToken } })
    if (!res.ok) throw new Error(`Shopify orders API error: ${res.status}`)
    const json = await res.json()
    orders.push(...(json.orders ?? []))

    const link: string = res.headers.get("Link") ?? ""
    const next: RegExpMatchArray | null = link.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  const headers = [
    "order_id", "created_at", "customer_name", "email",
    "total_price", "subtotal_price", "financial_status", "fulfillment_status",
    "item_count", "products",
  ]

  const rows: Record<string, string>[] = orders.map((o) => ({
    order_id:           String(o.id),
    created_at:         o.created_at ? o.created_at.slice(0, 10) : "",
    customer_name:      [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" "),
    email:              o.customer?.email ?? "",
    total_price:        o.total_price,
    subtotal_price:     o.subtotal_price,
    financial_status:   o.financial_status ?? "",
    fulfillment_status: o.fulfillment_status ?? "unfulfilled",
    item_count:         String(o.line_items.reduce((s, i) => s + i.quantity, 0)),
    products:           o.line_items.map((i) => i.title).join(", "),
  }))

  return { name: datasetName, headers, rows }
}
