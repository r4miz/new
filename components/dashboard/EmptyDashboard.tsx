import Link from "next/link"
import { BarChart3, ArrowRight } from "lucide-react"

export function EmptyDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <BarChart3 size={24} className="text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">No KPIs yet</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        Upload a CSV and our AI will analyze your data and propose the metrics
        that matter most for your business.
      </p>
      <Link
        href={`/w/${workspaceSlug}/data/upload`}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
      >
        Connect your first data source
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
