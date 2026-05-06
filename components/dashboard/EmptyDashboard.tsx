import Link from "next/link"
import { Upload, Plug, ArrowRight } from "lucide-react"

export function EmptyDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="relative mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Upload size={26} className="text-white" />
        </div>
        <div className="absolute -bottom-2 -right-3 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
          <Plug size={14} className="text-white" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">No KPIs yet</h2>
      <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-8">
        Upload a CSV or connect an integration. Our AI will analyze your data
        and build a full KPI dashboard in under a minute.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/w/${workspaceSlug}/data/upload`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          <Upload size={15} />
          Upload a CSV
          <ArrowRight size={14} />
        </Link>
        <Link
          href={`/w/${workspaceSlug}/integrations`}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plug size={15} />
          Connect an integration
        </Link>
      </div>
    </div>
  )
}
