export const PLANS = {
  starter: {
    name: "Starter",
    price: 99,
    description: "For solo founders and small teams getting started with data.",
    features: [
      "1 workspace",
      "Up to 5 datasets",
      "AI-generated KPI dashboard",
      "5 KPIs per dataset",
      "Data drill-in & row tables",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
  },
  pro: {
    name: "Pro",
    price: 249,
    description: "For growing businesses that need unlimited data and AI chat.",
    features: [
      "Up to 5 workspaces",
      "Unlimited datasets",
      "Unlimited KPIs per dataset",
      "AI Chat — ask questions about your data",
      "Team members (up to 5)",
      "Priority email & chat support",
    ],
    cta: "Get started",
    popular: true,
  },
  business: {
    name: "Business",
    price: 499,
    description: "For teams that need integrations and enterprise-grade scale.",
    features: [
      "Unlimited workspaces",
      "Unlimited datasets",
      "Everything in Pro",
      "Native integrations (Shopify, QuickBooks, Sheets)",
      "Unlimited team members",
      "Dedicated account manager + SLA",
    ],
    cta: "Get started",
    popular: false,
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getDaysLeft(trialEndsAt: string): number {
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export function isActive(status: string, trialEndsAt: string): boolean {
  if (status === "active") return true
  if (status === "trialing" && new Date(trialEndsAt) > new Date()) return true
  return false
}
