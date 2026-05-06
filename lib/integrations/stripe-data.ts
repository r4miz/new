import type { RawSyncData } from "./types"

export async function validateStripeKey(secretKey: string): Promise<void> {
  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  if (!res.ok) throw new Error(`Stripe validation failed (${res.status}). Check your secret key.`)
}

export async function fetchStripePayments(params: {
  secretKey:   string
  datasetName: string
}): Promise<RawSyncData> {
  const { secretKey, datasetName } = params
  const headers = { Authorization: `Bearer ${secretKey}` }
  const payments: Record<string, string>[] = []
  let startingAfter: string | undefined

  while (payments.length < 5000) {
    const url = new URL("https://api.stripe.com/v1/payment_intents")
    url.searchParams.set("limit", "100")
    if (startingAfter) url.searchParams.set("starting_after", startingAfter)

    const res  = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`Stripe payments API error: ${res.status}`)
    const json = await res.json()

    for (const pi of json.data ?? []) {
      if (pi.status !== "succeeded") continue
      payments.push({
        payment_id:     pi.id,
        date:           pi.created ? new Date(pi.created * 1000).toISOString().slice(0, 10) : "",
        amount:         (pi.amount / 100).toFixed(2),
        currency:       (pi.currency ?? "").toUpperCase(),
        status:         pi.status,
        customer_email: pi.receipt_email ?? "",
        description:    pi.description ?? "",
        payment_method: pi.payment_method_types?.[0] ?? "",
      })
    }

    if (!json.has_more) break
    startingAfter = json.data?.[json.data.length - 1]?.id
  }

  return {
    name: datasetName,
    headers: ["payment_id","date","amount","currency","status","customer_email","description","payment_method"],
    rows: payments,
  }
}
