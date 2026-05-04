export const PLANS = {
  starter: {
    name: "Starter",
    description: "For solo founders getting started with AI analytics.",
    monthly: { price: 15, priceEnvKey: "STRIPE_STARTER_MONTHLY_PRICE_ID" },
    yearly:  { price: 150, priceEnvKey: "STRIPE_STARTER_YEARLY_PRICE_ID", perMonth: 12.50, saving: 30 },
    features: [
      "1 workspace",
      "Up to 5 datasets",
      "AI-generated KPI dashboard",
      "Data drill-in & tables",
      "AI business advisor chat",
      "Email support",
    ],
    popular: false,
  },
  pro: {
    name: "Pro",
    description: "For growing businesses that need unlimited data and AI insights.",
    monthly: { price: 35, priceEnvKey: "STRIPE_PRO_MONTHLY_PRICE_ID" },
    yearly:  { price: 350, priceEnvKey: "STRIPE_PRO_YEARLY_PRICE_ID", perMonth: 29.17, saving: 70 },
    features: [
      "Up to 5 workspaces",
      "Unlimited datasets",
      "Unlimited KPIs",
      "AI business advisor chat",
      "Team members (up to 5)",
      "Priority support",
    ],
    popular: true,
  },
} as const

export type PlanKey = keyof typeof PLANS
export type BillingPeriod = "monthly" | "yearly"

export function getPriceId(plan: PlanKey, period: BillingPeriod): string | undefined {
  return process.env[PLANS[plan][period].priceEnvKey]
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
