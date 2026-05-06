"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/onboarding"); router.refresh()
  }

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.6px" }}>
        Sign in
      </h1>
      <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 36px" }}>
        Welcome back. Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Field label="Email address">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)}
          />
        </Field>

        <Field label="Password">
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)}
          />
        </Field>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "13.5px", color: "#94a3b8", marginTop: "28px" }}>
        No account?{" "}
        <Link href="/signup" style={{ color: "#0ea5e9", fontWeight: 600, textDecoration: "none" }}>
          Start free trial →
        </Link>
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "7px" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "11px 14px", fontSize: "13px", color: "#b91c1c" }}>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  fontSize: "14px", color: "#0f172a", outline: "none",
  background: "white", boxSizing: "border-box",
  transition: "border-color 0.15s",
}
const focusStyle = { borderColor: "#0ea5e9", boxShadow: "0 0 0 3px rgba(14,165,233,0.1)" }
const blurStyle  = { borderColor: "#e2e8f0", boxShadow: "none" }

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "12px", borderRadius: "8px", width: "100%",
    background: loading ? "#7dd3fc" : "#0ea5e9",
    color: "white", border: "none", cursor: loading ? "default" : "pointer",
    fontSize: "14px", fontWeight: 600, letterSpacing: "-0.1px",
    transition: "background 0.15s",
  }
}
