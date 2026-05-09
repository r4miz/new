import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { PLANS } from "@/lib/billing"
import { PricingCards } from "@/components/billing/PricingCards"
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton"
import { CheckCircle } from "lucide-react"
import { T } from "@/lib/theme"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",         color: T.green,   bg: "rgba(16,185,129,0.12)"  },
  past_due: { label: "Payment failed", color: T.red,     bg: "rgba(239,68,68,0.12)"   },
  canceled: { label: "Canceled",       color: T.textDim, bg: "rgba(71,85,105,0.12)"   },
  expired:  { label: "Inactive",       color: T.textDim, bg: "rgba(71,85,105,0.12)"   },
  trialing: { label: "Not subscribed", color: T.textDim, bg: "rgba(71,85,105,0.12)"   },
}

const card: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "28px",
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) redirect("/onboarding")

  const status   = workspace.subscription_status
  const isActive = status === "active"
  const cfg      = STATUS[status] ?? STATUS.expired

  return (
    <div style={{ minHeight: "100%", background: T.bg }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "20px 28px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.text }}>Billing</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13px", color: T.textMuted }}>Manage your subscription and payment details.</p>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Status card */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Current plan
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: T.text }}>
                    {isActive ? "BizIntel Pro" : "No active subscription"}
                  </h2>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", color: T.textMuted, lineHeight: 1.6 }}>
                  {isActive && "Your subscription is active. Manage billing and invoices below."}
                  {status === "past_due" && "Your last payment failed. Update your payment method to restore access."}
                  {(status === "canceled" || status === "expired" || status === "trialing") && "Subscribe to unlock full access to BizIntel Pro."}
                </p>
              </div>
              {isActive && workspace.stripe_customer_id && <ManageSubscriptionButton workspaceId={workspace.id} />}
            </div>
          </div>

          {/* Subscribe prompt */}
          {!isActive && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700, color: T.text }}>
                Subscribe to BizIntel Pro
              </h2>
              <PricingCards workspaceId={workspace.id} />
            </div>
          )}

          {/* Features breakdown for active subscribers */}
          {isActive && (
            <div style={card}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: T.text }}>What&apos;s included in Pro</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {PLANS.pro.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle size={14} color={T.accent} />
                    <span style={{ fontSize: "13.5px", color: T.textSec }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
