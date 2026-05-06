import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getDaysLeft, PLANS } from "@/lib/billing"
import { PricingCards } from "@/components/billing/PricingCards"
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton"
import { CheckCircle } from "lucide-react"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",         color: "#059669", bg: "#ecfdf5" },
  trialing: { label: "Free trial",     color: "#d97706", bg: "#fffbeb" },
  past_due: { label: "Payment failed", color: "#dc2626", bg: "#fef2f2" },
  canceled: { label: "Canceled",       color: "#64748b", bg: "#f8fafc" },
  expired:  { label: "Expired",        color: "#64748b", bg: "#f8fafc" },
}

const pageStyle = { minHeight: "100%", background: "#f1f5f9" }

const headerStyle = {
  background: "white", borderBottom: "1px solid #e5e7eb",
  padding: "28px 36px", flexShrink: 0,
}

const cardStyle = {
  background: "white", border: "1px solid #e5e7eb",
  borderRadius: "12px", padding: "28px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
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
  const daysLeft = getDaysLeft(workspace.trial_ends_at)
  const isActive = status === "active"
  const cfg      = STATUS[status] ?? STATUS.expired

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Billing</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#6b7280" }}>Manage your subscription and payment details.</p>
        </div>
      </div>

      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Current plan */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Current plan
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                    {isActive ? "Pro" : "Free Trial"}
                  </h2>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "99px",
                    color: cfg.color, background: cfg.bg,
                  }}>
                    ● {cfg.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
                  {status === "trialing" && daysLeft > 0 && `Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. All features included.`}
                  {status === "trialing" && daysLeft === 0 && "Your trial has ended. Choose a plan below."}
                  {status === "active" && "Your subscription is active. Manage billing, invoices, and payment below."}
                  {status === "past_due" && "Your last payment failed. Update your payment method to restore access."}
                  {(status === "canceled" || status === "expired") && "Subscription ended. Choose a plan below to reactivate."}
                </p>
              </div>
              {isActive && workspace.stripe_customer_id && (
                <ManageSubscriptionButton workspaceId={workspace.id} />
              )}
            </div>

            {status === "trialing" && daysLeft > 0 && (
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Trial progress</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{14 - daysLeft} / 14 days used</span>
                </div>
                <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    background: daysLeft <= 3 ? "#ef4444" : "#f59e0b",
                    width: `${Math.min(100, ((14 - daysLeft) / 14) * 100)}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Pricing plans */}
          {!isActive && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                {status === "trialing" && daysLeft > 0 ? "Upgrade before your trial ends" : "Choose a plan to continue"}
              </h2>
              <PricingCards workspaceId={workspace.id} />
            </div>
          )}

          {/* Features (active) */}
          {isActive && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                What&apos;s included in Pro
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {PLANS.pro.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle size={14} color="#0ea5e9" />
                    <span style={{ fontSize: "13.5px", color: "#374151" }}>{f}</span>
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
