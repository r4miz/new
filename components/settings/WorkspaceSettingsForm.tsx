"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, CheckCircle } from "lucide-react"
import type { Workspace } from "@/lib/types"

const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","JPY","SGD","INR","CHF","SEK"]
const SIZES      = ["1–10","11–50","51–200","201–500","500+"]

const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px",
  background: "#141d2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", fontSize: "14px", color: "#f8fafc", outline: "none",
  transition: "border-color 0.15s",
}
const LABEL: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "#475569", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.05em",
}

export function WorkspaceSettingsForm({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [name,     setName]     = useState(workspace.name)
  const [industry, setIndustry] = useState(workspace.industry ?? "")
  const [size,     setSize]     = useState(workspace.size ?? "")
  const [currency, setCurrency] = useState(workspace.primary_currency)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#0ea5e9"
    e.target.style.boxShadow   = "0 0 0 3px rgba(14,165,233,0.1)"
  }
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)"
    e.target.style.boxShadow   = "none"
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null); setSaved(false)
    const res  = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry: industry || null, size: size || null, primary_currency: currency }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? "Save failed"); setSaving(false); return }
    setSaved(true); setSaving(false); router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={LABEL}>Workspace name</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          style={INPUT} onFocus={focus} onBlur={blur} />
      </div>
      <div>
        <label style={LABEL}>Industry</label>
        <input type="text" value={industry} onChange={e => setIndustry(e.target.value)}
          placeholder="e.g. E-commerce, SaaS, Consulting…"
          style={INPUT} onFocus={focus} onBlur={blur} />
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#334155" }}>
          Personalises your AI advisor&apos;s recommendations.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={LABEL}>Company size</label>
          <select value={size} onChange={e => setSize(e.target.value)}
            style={{ ...INPUT, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ ...INPUT, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "11px 14px", fontSize: "13px", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="submit" disabled={saving} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 20px", borderRadius: "8px",
          background: saving ? "#141d2e" : "#0ea5e9",
          color: saving ? "#334155" : "white",
          border: "none", cursor: saving ? "default" : "pointer",
          fontSize: "14px", fontWeight: 700, transition: "background 0.15s",
        }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#34d399", fontWeight: 500 }}>
            <CheckCircle size={14} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
