"use client"

import { useState } from "react"
import { Check, Loader2, Zap } from "lucide-react"
import { PLANS, type BillingPeriod } from "@/lib/billing"
import { T } from "@/lib/theme"

interface Props { workspaceId: string; currentPlan?: string }

export function PricingCards({ workspaceId, currentPlan }: Props) {
  const [period,  setPeriod]  = useState<BillingPeriod>("monthly")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const plan    = PLANS.pro
  const pricing = plan[period]
  const isCurrent = currentPlan === "pro"

  async function handleUpgrade() {
    setLoading(true); setError(null)
    try {
      const res  = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, plan: "pro", period }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Checkout failed")
      window.location.href = json.url
    } catch (e) { setError(String(e)); setLoading(false) }
  }

  return (
    <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>

      {/* Period toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: T.surface2, borderRadius: "10px",
          padding: "4px", gap: "4px", border: `1px solid ${T.border}`,
        }}>
          {(["monthly", "yearly"] as BillingPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "7px 20px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              background: period === p ? T.surface : "transparent",
              color: period === p ? T.text : T.textMuted,
              boxShadow: period === p ? T.shadow1 : "none",
              transition: "all 0.15s",
            }}>
              {p === "yearly" ? "Yearly" : "Monthly"}
              {p === "yearly" && (
                <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: "rgba(16,185,129,0.15)", color: T.green }}>
                  Save 25%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Single plan card */}
      <div style={{
        borderRadius: "16px", overflow: "hidden",
        border: `1.5px solid ${T.accent}`,
        boxShadow: `0 0 48px ${T.accentGlow}, 0 8px 32px rgba(0,0,0,0.5)`,
        background: T.surface,
      }}>
        {/* Top gradient bar */}
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.accent}, ${T.indigo})` }} />

        {/* Header */}
        <div style={{ padding: "28px 28px 24px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: T.accentDim, border: `1px solid rgba(14,165,233,0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={15} color={T.accent} fill={T.accent} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: T.text }}>BizIntel Pro</h3>
                <p style={{ margin: 0, fontSize: "11px", color: T.textMuted }}>Everything. No limits.</p>
              </div>
            </div>
            {isCurrent && (
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "99px", background: "rgba(16,185,129,0.12)", color: T.green, border: "1px solid rgba(16,185,129,0.2)" }}>
                Current plan
              </span>
            )}
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "56px", fontWeight: 900, color: T.text, letterSpacing: "-2px", lineHeight: 1, fontFamily: "var(--font-mono, monospace)" }}>
              ${pricing.price}
            </span>
            <span style={{ fontSize: "14px", color: T.textMuted, marginBottom: "8px" }}>
              /{period === "yearly" ? "yr" : "mo"}
            </span>
          </div>

          {period === "yearly" && "perMonth" in pricing ? (
            <p style={{ margin: 0, fontSize: "13px", color: T.green, fontWeight: 600 }}>
              ${pricing.perMonth}/mo effective · Save ${pricing.saving} vs monthly
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: T.textDim }}>
              Billed monthly · Cancel anytime
            </p>
          )}
        </div>

        {/* Features */}
        <div style={{ padding: "24px 28px" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "13px" }}>
            {plan.features.map(f => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "11px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "1px", background: T.accentDim, border: `1px solid rgba(14,165,233,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={10} color={T.accent} strokeWidth={3} />
                </div>
                <span style={{ fontSize: "13.5px", color: T.textSec, lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p style={{ fontSize: "12px", color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading || isCurrent}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px",
              fontSize: "14px", fontWeight: 800,
              border: "none", cursor: loading || isCurrent ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: isCurrent ? T.surface2 : `linear-gradient(135deg, ${T.accent}, ${T.indigo})`,
              color: isCurrent ? T.textDim : "white",
              boxShadow: !isCurrent ? `0 4px 24px ${T.accentGlow}` : "none",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isCurrent ? "You're on Pro" : loading ? "Redirecting…" : `Start 14-day free trial →`}
          </button>

          <p style={{ textAlign: "center", fontSize: "11.5px", color: T.textDim, marginTop: "12px" }}>
            No credit card required · Cancel anytime · All major cards
          </p>
        </div>
      </div>
    </div>
  )
}
