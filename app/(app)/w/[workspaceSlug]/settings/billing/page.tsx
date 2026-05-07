import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getDaysLeft, PLANS } from "@/lib/billing"
import { PricingCards } from "@/components/billing/PricingCards"
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton"
import { CheckCircle } from "lucide-react"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",         color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  trialing: { label: "Free trial",     color: "#fcd34d", bg: "rgba(252,211,77,0.12)"  },
  past_due: { label: "Payment failed", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  canceled: { label: "Canceled",       color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  expired:  { label: "Expired",        color: "#64748b", bg: "rgba(100,116,139,0.12)" },
}

const card: React.CSSProperties = {
  background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px", padding: "28px",
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
    <div style={{ minHeight: "100%", background: "#07090e" }}>
      <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 36px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>Billing</h1>
          <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: "#475569" }}>Manage your subscription and payment details.</p>
        </div>
      </div>

      <div style={{ padding: "32px 36px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>Current plan</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f8fafc" }}>{isActive ? "Pro" : "Free Trial"}</h2>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "99px", color: cfg.color, background: cfg.bg }}>
                    ● {cfg.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
                  {status === "trialing" && daysLeft > 0 && `Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. All features included.`}
                  {status === "trialing" && daysLeft === 0 && "Your trial has ended. Choose a plan below."}
                  {status === "active" && "Your subscription is active. Manage billing and invoices below."}
                  {status === "past_due" && "Your last payment failed. Update your payment method to restore access."}
                  {(status === "canceled" || status === "expired") && "Subscription ended. Choose a plan below to reactivate."}
                </p>
              </div>
              {isActive && workspace.stripe_customer_id && <ManageSubscriptionButton workspaceId={workspace.id} />}
            </div>

            {status === "trialing" && daysLeft > 0 && (
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#475569" }}>Trial progress</span>
                  <span style={{ fontSize: "12px", color: "#475569" }}>{14 - daysLeft} / 14 days used</span>
                </div>
                <div style={{ height: "5px", background: "#141d2e", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "99px", background: daysLeft <= 3 ? "#ef4444" : "#f59e0b", width: `${Math.min(100, ((14 - daysLeft) / 14) * 100)}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {!isActive && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.3px" }}>
                {status === "trialing" && daysLeft > 0 ? "Upgrade before your trial ends" : "Choose a plan"}
              </h2>
              <PricingCards workspaceId={workspace.id} />
            </div>
          )}

          {isActive && (
            <div style={card}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>What&apos;s included in Pro</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {PLANS.pro.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle size={14} color="#0ea5e9" />
                    <span style={{ fontSize: "13.5px", color: "#94a3b8" }}>{f}</span>
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
