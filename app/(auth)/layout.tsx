import { TrendingUp, BarChart3, MessageSquare, Plug, Star } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Left panel (dark, branded) ── */}
      <div style={{
        display: "none",
        width: "45%",
        background: "linear-gradient(160deg, #0b0d14 0%, #0f172a 50%, #1e1b4b 100%)",
        flexDirection: "column",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
      }}
        className="lg-show"
      >
        {/* Ambient glows */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "0", right: "-60px", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "10%", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
          }}>
            <TrendingUp size={17} color="white" />
          </div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "17px", letterSpacing: "-0.4px" }}>BizIntel</span>
        </div>

        {/* Hero text */}
        <div style={{ marginTop: "auto", position: "relative" }}>
          <h1 style={{
            fontSize: "36px", fontWeight: 800, color: "#f8fafc",
            lineHeight: 1.15, margin: "0 0 16px",
            letterSpacing: "-0.8px",
          }}>
            Your AI business<br />
            analyst,{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              always on.
            </span>
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65, marginBottom: "36px", maxWidth: "300px" }}>
            Upload your data, get instant AI-generated dashboards, and ask any business question in plain English.
          </p>

          {/* Features */}
          {[
            { Icon: BarChart3,     text: "AI-generated KPI dashboards in under a minute" },
            { Icon: MessageSquare, text: "Ask questions, get expert answers grounded in your data" },
            { Icon: Plug,          text: "Connects to Shopify, HubSpot, Stripe, and more" },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "28px", height: "28px", flexShrink: 0,
                borderRadius: "8px", marginTop: "1px",
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={13} color="#60a5fa" />
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{text}</p>
            </div>
          ))}

          {/* Trust strip */}
          <div style={{
            marginTop: "36px", paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{ display: "flex" }}>
              {[1,2,3,4,5].map((i) => <Star key={i} size={12} color="#f59e0b" fill="#f59e0b" />)}
            </div>
            <span style={{ fontSize: "12px", color: "#475569" }}>14-day free trial · No card required · Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "white", padding: "40px 32px",
      }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "36px" }}>
            <div style={{
              width: "30px", height: "30px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp size={15} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a", letterSpacing: "-0.3px" }}>BizIntel</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
