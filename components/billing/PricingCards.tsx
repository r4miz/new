"use client"

import { useState } from "react"
import { Check, Sparkles, Loader2 } from "lucide-react"
import { PLANS, type PlanKey } from "@/lib/billing"

interface Props {
  workspaceId: string
  currentPlan?: string
}

export function PricingCards({ workspaceId, currentPlan }: Props) {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: PlanKey) {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, plan }),
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
    <div className="w-full">
      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
          const isPopular  = plan.popular
          const isCurrent  = currentPlan === key
          const isLoading  = loading === key

          return (
            <div
              key={key}
              className={`relative flex flex-col rounded-2xl bg-white transition-all duration-200 ${
                isPopular
                  ? "border-2 border-blue-500 shadow-xl shadow-blue-100"
                  : "border border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <Sparkles size={11} />
                    Most popular
                  </span>
                </div>
              )}

              <div className={`p-6 border-b ${isPopular ? "border-blue-100" : "border-slate-100"}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-slate-400 text-sm mb-1.5">/mo</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Billed monthly · Cancel anytime</p>
              </div>

              <div className="flex-1 p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check
                        size={15}
                        className={`flex-shrink-0 mt-0.5 ${isPopular ? "text-blue-500" : "text-emerald-500"}`}
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!loading || isCurrent}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : isPopular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 hover:shadow-blue-300"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  } disabled:opacity-60`}
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {isCurrent ? "Current plan" : isLoading ? "Redirecting…" : plan.cta}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Prices in USD · No setup fees · Cancel anytime · All major cards accepted
      </p>
    </div>
  )
}
