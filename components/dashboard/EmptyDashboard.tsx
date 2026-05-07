import Link from "next/link"
import { Upload, Plug, ArrowRight } from "lucide-react"

export function EmptyDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ position: "relative", marginBottom: "28px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px",
          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(14,165,233,0.3)",
        }}>
          <Upload size={26} color="white" />
        </div>
        <div style={{
          position: "absolute", bottom: "-6px", right: "-8px",
          width: "28px", height: "28px", borderRadius: "8px",
          background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
        }}>
          <Plug size={13} color="white" />
        </div>
      </div>

      <h2 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.4px" }}>
        No KPIs yet
      </h2>
      <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#475569", lineHeight: 1.65, maxWidth: "380px" }}>
        Upload a CSV or connect an integration. AI will analyze your data and build a full KPI dashboard in under a minute.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/w/${workspaceSlug}/data/upload`} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#0ea5e9", color: "white",
          fontSize: "14px", fontWeight: 700,
          padding: "11px 22px", borderRadius: "9px", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
        }}>
          <Upload size={15} />
          Upload CSV
          <ArrowRight size={14} />
        </Link>
        <Link href={`/w/${workspaceSlug}/integrations`} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#141d2e", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", fontSize: "14px", fontWeight: 600,
          padding: "11px 22px", borderRadius: "9px", textDecoration: "none",
        }}>
          <Plug size={15} />
          Connect integration
        </Link>
      </div>
    </div>
  )
}
