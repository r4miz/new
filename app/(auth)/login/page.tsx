"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowRight } from "lucide-react"

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  fontSize: "14px", color: "#0f172a", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  background: "white", boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "#374151", marginBottom: "6px", letterSpacing: "0.02em",
}

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [focused,  setFocused]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/onboarding"); router.refresh()
  }

  const focusedStyle = { borderColor: "#3b82f6", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)" }

  return (
    <div>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.6px" }}>
        Welcome back
      </h1>
      <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px" }}>
        Sign in to your workspace
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={labelStyle}>Email address</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{ ...inputStyle, ...(focused === "email" ? focusedStyle : {}) }}
            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ ...inputStyle, ...(focused === "password" ? focusedStyle : {}) }}
            onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
          />
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
            padding: "10px 14px", fontSize: "13px", color: "#dc2626",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "10px",
            background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px", fontWeight: 700, letterSpacing: "-0.1px",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            transition: "all 0.15s",
          }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight size={15} />}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "24px" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
          Start free trial →
        </Link>
      </p>
    </div>
  )
}
