import { Lock } from "lucide-react"
import { PricingCards } from "./PricingCards"

interface Props {
  workspace: { id: string; name: string }
}

export function UpgradeWall({ workspace }: Props) {
  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
            <Lock size={24} className="text-slate-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Your free trial has ended
          </h1>
          <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
            Choose a plan to restore access to{" "}
            <span className="font-semibold text-slate-700">{workspace.name}</span> and
            keep your AI-powered dashboard running.
          </p>
        </div>

        <PricingCards workspaceId={workspace.id} />
      </div>
    </div>
  )
}
