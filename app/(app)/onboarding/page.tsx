"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"]
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "INR"]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, size, primary_currency: currency }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to create workspace")
      setLoading(false)
      return
    }

    router.push(`/w/${data.workspace.slug}/data/upload`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Set up your workspace</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tell us about your business so we can tailor the analytics to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. E-commerce, SaaS, Restaurant, Consulting…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company size (employees)
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select size…</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition"
          >
            {loading ? "Creating workspace…" : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  )
}
