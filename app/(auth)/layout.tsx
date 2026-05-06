import { TrendingUp, BarChart3, MessageSquare, Plug } from "lucide-react"

const FEATURES = [
  { icon: BarChart3,     text: "AI-generated KPI dashboards from any data source in minutes" },
  { icon: MessageSquare, text: "Ask your data questions and get expert answers instantly" },
  { icon: Plug,          text: "Connects to Shopify, Google Sheets, HubSpot, and more" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — branded panel */}
      <div className="hidden lg:flex w-[46%] bg-[#0c0f1a] flex-col px-14 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">BizIntel</span>
        </div>

        <div className="mt-auto relative pb-4">
          <h1 className="text-[2.1rem] font-bold text-white leading-tight mb-4">
            Your AI-powered<br />
            business analyst,<br />
            <span className="text-blue-400">always on.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-xs">
            Connect your data, get instant AI dashboards, and ask any business question in plain English.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={13} className="text-blue-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            <p className="text-slate-600 text-xs">14-day free trial · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">BizIntel</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
