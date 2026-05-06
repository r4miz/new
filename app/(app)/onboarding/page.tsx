"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart2, Loader2 } from "lucide-react"

const SIZES      = ["1–10", "11–50", "51–200", "201–500", "500+"]
const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","JPY","SGD","INR","CHF","SEK","NOK","DKK"]

const iStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  border: "1.5px solid #e5e7eb", borderRadius: "8px",
  fontSize: "14px", color: "#0f172a", background: "white", outline: "none",
  transition: "border-color 0.15s",
}

const lStyle: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "7px",
}

export default function OnboardingPage() {
  const router = useRouter()
  const [name,     setName]     = useState("")
  const [industry, setIndustry] = useState("")
  const [size,     setSize]     = useState("")
  const [currency, setCurrency] = useState("USD")
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const res  = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, size, primary_currency: currency }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return }
    router.push(`/w/${data.workspace.slug}/data/upload`)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "40px" }}>
          <div style={{ width: "36px", height: "36px", background: "#0ea5e9", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.4px" }}>BizIntel</span>
        </div>

        <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "40px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Set up your workspace
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 32px", lineHeight: 1.5 }}>
            Tell us about your business so we can tailor the AI analytics to you.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={lStyle}>Business name <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Acme Corp" style={iStyle}
                onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)" }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <div>
              <label style={lStyle}>Industry</label>
              <input
                type="text" value={industry} onChange={e => setIndustry(e.target.value)}
                placeholder="e.g. E-commerce, SaaS, Consulting…" style={iStyle}
                onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)" }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none" }}
              />
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "6px 0 0" }}>
                Used to personalise your AI advisor's recommendations.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lStyle}>Company size</label>
                <select value={size} onChange={e => setSize(e.target.value)} style={{ ...iStyle, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...iStyle, cursor: "pointer" }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "11px 14px", fontSize: "13px", color: "#b91c1c" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !name}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "13px", borderRadius: "8px", background: loading || !name ? "#6b7280" : "#0f172a",
                color: "white", border: "none", cursor: loading || !name ? "default" : "pointer",
                fontSize: "14px", fontWeight: 700, marginTop: "4px", transition: "background 0.15s",
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Creating workspace…" : "Continue →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
