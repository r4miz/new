import type { KpiProposal } from "@/lib/types"
import { TrendingUp } from "lucide-react"

interface Props {
  kpi: KpiProposal
}

export function KpiTile({ kpi }: Props) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{kpi.name}</h3>
        </div>
        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
          Preview
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed">{kpi.description}</p>

      {/* SQL proposal */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          Proposed query
        </p>
        <pre className="bg-slate-950 text-slate-300 text-xs rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
          {kpi.proposed_sql}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">
          Chart: {kpi.chart_type}
        </span>
        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
          SQL not yet executed — slice 1.5
        </span>
      </div>
    </div>
  )
}
