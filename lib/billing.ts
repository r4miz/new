export const PLANS = {
  pro: {
    name: "Pro",
    description: "Everything you need to run a data-driven business.",
    monthly: { price: 49,  priceEnvKey: "STRIPE_PRO_MONTHLY_PRICE_ID" },
    yearly:  { price: 468, priceEnvKey: "STRIPE_PRO_YEARLY_PRICE_ID", perMonth: 39, saving: 120 },
    features: [
      "Unlimited datasets & KPIs",
      "AI-generated KPI dashboard",
      "AI business advisor chat",
      "6 data integrations (Shopify, Stripe, HubSpot…)",
      "Daily auto-sync",
      "Data drill-in & export",
      "Priority support",
    ],
    popular: true,
  },
} as const

export type PlanKey = keyof typeof PLANS
export type BillingPeriod = "monthly" | "yearly"

export function getPriceId(plan: PlanKey, period: BillingPeriod): string {
  const key = PLANS[plan][period].priceEnvKey
  const id = process.env[key]
  if (!id) throw new Error(`Missing env var: ${key}`)
  return id
}

export function getDaysLeft(trialEndsAt: string): number {
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export function isActive(status: string, trialEndsAt: string): boolean {
  if (status === "active") return true
  if (status === "trialing" && new Date(trialEndsAt) > new Date()) return true
  return false
}
