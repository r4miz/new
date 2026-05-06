import { BarChart2, CheckCircle } from "lucide-react"

const FEATURES = [
  "AI-generated KPI dashboards from any data source",
  "Ask your data questions, get expert answers instantly",
  "Connects to Shopify, HubSpot, Stripe, Airtable, and more",
  "Industry-expert AI advisor tailored to your business",
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "white" }}>

      {/* Left — dark branded panel */}
      <div
        className="auth-left"
        style={{
          width: "44%",
          backgroundColor: "#0f172a",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* Top: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          <div style={{
            width: "32px", height: "32px", background: "#0ea5e9",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BarChart2 size={16} color="white" />
          </div>
          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.3px" }}>
            BizIntel
          </span>
        </div>

        {/* Middle: copy */}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#0ea5e9", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            AI Business Intelligence
          </p>
          <h2 style={{
            fontSize: "34px", fontWeight: 800, color: "#f8fafc",
            lineHeight: 1.2, letterSpacing: "-0.8px", margin: "0 0 20px",
          }}>
            Every business deserves a data analyst.
          </h2>
          <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.65, margin: "0 0 36px", maxWidth: "340px" }}>
            Connect your data, get instant AI-generated insights, and ask any business question in plain English.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle size={15} color="#0ea5e9" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: social proof */}
        <div style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "24px",
        }}>
          <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", background: "white",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Mobile logo */}
          <div className="auth-left" style={{
            display: "none",
            alignItems: "center", gap: "8px", marginBottom: "40px",
          }}>
            <div style={{ width: "28px", height: "28px", background: "#0ea5e9", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>BizIntel</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
