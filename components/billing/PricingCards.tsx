"use client"

import { useState } from "react"
import { Check, Sparkles, Loader2 } from "lucide-react"
import { PLANS, type PlanKey, type BillingPeriod } from "@/lib/billing"

interface Props {
  workspaceId: string
  currentPlan?: string
}

export function PricingCards({ workspaceId, currentPlan }: Props) {
  const [period, setPeriod]   = useState<BillingPeriod>("monthly")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function handleUpgrade(plan: PlanKey) {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, plan, period }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Checkout failed")
      window.location.href = json.url
    } catch (e) {
      setError(String(e))
      setLoading(null)
    }
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Period toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", background: "#141d2e", borderRadius: "12px", padding: "4px", gap: "4px", border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              background: period === p ? "#0d1117" : "transparent",
              color: period === p ? "#f8fafc" : "#475569",
              boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
              transition: "all 0.15s",
            }}>
              {p === "yearly" ? "Yearly" : "Monthly"}
              {p === "yearly" && (
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "20px", fontSize: "13px", color: "#fca5a5", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "12px 16px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", maxWidth: "680px", margin: "0 auto" }}>
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
          const isPopular = plan.popular
          const isCurrent = currentPlan === key
          const isLoading = loading === key
          const pricing   = plan[period]

          return (
            <div key={key} style={{
              position: "relative", display: "flex", flexDirection: "column",
              borderRadius: "16px", overflow: "visible",
              background: "#0d1117",
              border: isPopular ? "1.5px solid #0ea5e9" : "1px solid rgba(255,255,255,0.07)",
              boxShadow: isPopular ? "0 0 32px rgba(14,165,233,0.12)" : "none",
            }}>
              {isPopular && (
                <div style={{ position: "absolute", top: "-14px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#0ea5e9", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "99px" }}>
                    <Sparkles size={11} /> Most popular
                  </span>
                </div>
              )}

              <div style={{ padding: "24px", borderBottom: `1px solid ${isPopular ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>{plan.name}</h3>
                  {isCurrent && (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "99px", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                      Current
                    </span>
                  )}
                </div>
                <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#475569", lineHeight: 1.6 }}>{plan.description}</p>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "42px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-1px", lineHeight: 1 }}>
                    ${pricing.price}
                  </span>
                  <span style={{ fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                    /{period === "yearly" ? "yr" : "mo"}
                  </span>
                </div>

                {"perMonth" in pricing && period === "yearly" ? (
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#10b981", fontWeight: 500 }}>
                    ${pricing.perMonth}/mo · Save ${pricing.saving} vs monthly
                  </p>
                ) : (
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#334155" }}>Billed monthly · Cancel anytime</p>
                )}
              </div>

              <div style={{ flex: 1, padding: "20px 24px" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#94a3b8" }}>
                      <Check size={14} color={isPopular ? "#0ea5e9" : "#10b981"} style={{ flexShrink: 0, marginTop: "2px" }} strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: "0 24px 24px" }}>
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!loading || isCurrent}
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: "10px", fontSize: "13px",
                    fontWeight: 700, border: "none", cursor: (loading || isCurrent) ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    background: isCurrent ? "#141d2e" : isPopular ? "#0ea5e9" : "#1a2540",
                    color: isCurrent ? "#334155" : "white",
                    opacity: (loading && !isLoading) ? 0.6 : 1,
                    transition: "background 0.15s",
                    boxShadow: isPopular && !isCurrent ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
                  }}
                >
                  {isLoading && <Loader2 size={13} className="animate-spin" />}
                  {isCurrent ? "Current plan" : isLoading ? "Redirecting…" : "Get started →"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: "12px", color: "#334155", marginTop: "20px" }}>
        No setup fees · Cancel anytime · All major cards accepted
      </p>
    </div>
  )
}
