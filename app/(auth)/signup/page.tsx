"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await createClient().auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/onboarding")
  }

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.6px" }}>
        Create your account
      </h1>
      <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 36px" }}>
        14-day free trial. No credit card required.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <Field label="Full name">
          <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith" style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)} />
        </Field>
        <Field label="Work email">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="jane@company.com" style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)} />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters" style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)} />
        </Field>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "11px 14px", fontSize: "13px", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "12px", borderRadius: "8px", width: "100%",
          background: loading ? "#7dd3fc" : "#0ea5e9",
          color: "white", border: "none", cursor: loading ? "default" : "pointer",
          fontSize: "14px", fontWeight: 600, marginTop: "4px",
          transition: "background 0.15s",
        }}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Creating account…" : "Start free trial"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "28px" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#0ea5e9", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "7px" }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  fontSize: "14px", color: "#0f172a", outline: "none",
  background: "white", boxSizing: "border-box", transition: "border-color 0.15s",
}
const focusStyle = { borderColor: "#0ea5e9", boxShadow: "0 0 0 3px rgba(14,165,233,0.1)" }
const blurStyle  = { borderColor: "#e2e8f0", boxShadow: "none" }
