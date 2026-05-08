import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { UploadFlow } from "@/components/data/UploadFlow"
import { Sparkles, Shield, Clock, BarChart2 } from "lucide-react"
import { T } from "@/lib/theme"

const HOW = [
  {
    icon: "01",
    title: "Upload your data",
    body: "Drop any CSV file. First row must contain column headers. Up to 4 MB.",
  },
  {
    icon: "02",
    title: "AI analyzes it",
    body: "Claude reads your columns, infers types, and writes a business-context description.",
  },
  {
    icon: "03",
    title: "KPIs are generated",
    body: "5 high-value KPIs with SQL queries and charts are built automatically for your dashboard.",
  },
]

const PERKS = [
  { Icon: Clock,    text: "Ready in under 60 seconds" },
  { Icon: Sparkles, text: "AI-written SQL — no code needed" },
  { Icon: Shield,   text: "Data stays in your private schema" },
  { Icon: BarChart2,text: "Live charts, trend badges, drill-in" },
]

export default async function UploadPage({
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

  return (
    <div style={{ minHeight: "100%", background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* Page header */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "20px 28px", flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.text, letterSpacing: "-0.2px" }}>
          Add data source
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.textMuted }}>
          Upload a CSV — AI builds your entire KPI dashboard automatically.
        </p>
      </div>

      {/* Two-column body */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", alignItems: "flex-start", gap: "28px", maxWidth: "1100px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* Left: upload form */}
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <UploadFlow workspace={workspace} />
        </div>

        {/* Right: how it works */}
        <div style={{ width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Steps */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px" }}>
            <p style={{ margin: "0 0 18px", fontSize: "11px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              How it works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {HOW.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "14px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
                    background: T.accentDim, border: `1px solid rgba(14,165,233,0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 800, color: T.accent, fontFamily: "monospace",
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: T.text }}>{step.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: T.textMuted, lineHeight: 1.55 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              What you get
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {PERKS.map(({ Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={13} color={T.accent} />
                  <span style={{ fontSize: "12.5px", color: T.textSec }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <p style={{ margin: 0, fontSize: "11.5px", color: T.textDim, textAlign: "center" }}>
            Supports .csv · .xlsx · .xls · up to 4 MB
          </p>
        </div>
      </div>
    </div>
  )
}
