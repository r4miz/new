import Link from "next/link"
import { Upload, Plug, Sparkles } from "lucide-react"
import { T } from "@/lib/theme"

export function EmptyDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 24px", textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        width: "56px", height: "56px", borderRadius: "14px", marginBottom: "20px",
        background: T.surface2, border: `1px solid ${T.borderMd}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 0 8px ${T.accentDim}`,
      }}>
        <Sparkles size={24} color={T.accent} />
      </div>

      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>
        No KPIs yet
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: "13.5px", color: T.textMuted, lineHeight: 1.7, maxWidth: "340px" }}>
        Upload a CSV or connect an integration — AI will analyze your data and build a KPI dashboard automatically.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/w/${workspaceSlug}/data/upload`} style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: T.accent, color: "white",
          fontSize: "13px", fontWeight: 700,
          padding: "10px 20px", borderRadius: "8px", textDecoration: "none",
          boxShadow: `0 4px 16px ${T.accentGlow}`,
        }}>
          <Upload size={14} />
          Upload CSV
        </Link>
        <Link href={`/w/${workspaceSlug}/integrations`} style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: T.surface2, border: `1px solid ${T.borderMd}`,
          color: T.textSec, fontSize: "13px", fontWeight: 600,
          padding: "10px 20px", borderRadius: "8px", textDecoration: "none",
        }}>
          <Plug size={14} />
          Connect integration
        </Link>
      </div>
    </div>
  )
}
