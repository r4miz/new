import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { getDaysLeft, PLANS } from "@/lib/billing"
import { PricingCards } from "@/components/billing/PricingCards"
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton"
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react"

const STATUS_CONFIG = {
  active:    { icon: CheckCircle,    color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Active" },
  trialing:  { icon: Clock,          color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",     label: "Free trial" },
  past_due:  { icon: AlertTriangle,  color: "text-red-600",     bg: "bg-red-50 border-red-200",         label: "Payment failed" },
  canceled:  { icon: XCircle,        color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     label: "Canceled" },
  expired:   { icon: XCircle,        color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     label: "Expired" },
} as const

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

  const status   = workspace.subscription_status as keyof typeof STATUS_CONFIG
  const daysLeft = getDaysLeft(workspace.trial_ends_at)
  const isActive = status === "active"
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.expired
  const StatusIcon = statusCfg.icon

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your subscription and payment details.</p>
      </div>

      {/* Current plan card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current plan</p>
            <div className="flex items-center gap-2.5 mb-3">
              <h2 className="text-xl font-bold text-slate-900">
                {isActive ? "Pro" : "Free Trial"}
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                <StatusIcon size={12} />
                {statusCfg.label}
              </span>
            </div>

            {status === "trialing" && (
              <p className="text-sm text-slate-500">
                {daysLeft > 0
                  ? `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. All Pro features are included.`
                  : "Your trial has ended. Choose a plan below to continue."}
              </p>
            )}
            {status === "active" && (
              <p className="text-sm text-slate-500">
                Your subscription is active. Manage payment method, view invoices, or cancel below.
              </p>
            )}
            {status === "past_due" && (
              <p className="text-sm text-red-600">
                Your last payment failed. Please update your payment method to restore access.
              </p>
            )}
            {(status === "canceled" || status === "expired") && (
              <p className="text-sm text-slate-500">
                Your subscription has ended. Choose a plan below to reactivate.
              </p>
            )}
          </div>

          {isActive && workspace.stripe_customer_id && (
            <ManageSubscriptionButton workspaceId={workspace.id} />
          )}
        </div>

        {/* Trial progress bar */}
        {status === "trialing" && daysLeft > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Trial progress</span>
              <span>{14 - daysLeft} of 14 days used</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((14 - daysLeft) / 14) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pricing plans (show when not active) */}
      {!isActive && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-5">
            {status === "trialing" && daysLeft > 0
              ? "Upgrade before your trial ends"
              : "Choose a plan"}
          </h2>
          <PricingCards workspaceId={workspace.id} />
        </div>
      )}

      {/* What's included (show when active) */}
      {isActive && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">What&apos;s included in your plan</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
