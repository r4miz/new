"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, CheckCircle } from "lucide-react"
import type { Workspace } from "@/lib/types"

const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","JPY","SGD","INR","CHF","SEK","NOK","DKK"]
const SIZES      = ["1–10","11–50","51–200","201–500","500+"]

interface Props { workspace: Workspace }

export function WorkspaceSettingsForm({ workspace }: Props) {
  const router = useRouter()
  const [name,     setName]     = useState(workspace.name)
  const [industry, setIndustry] = useState(workspace.industry ?? "")
  const [size,     setSize]     = useState(workspace.size ?? "")
  const [currency, setCurrency] = useState(workspace.primary_currency)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry: industry || null, size: size || null, primary_currency: currency }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? "Save failed"); setSaving(false); return }

    setSaved(true)
    setSaving(false)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Workspace name
        </label>
        <input
          type="text" required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Industry
        </label>
        <input
          type="text" value={industry} onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. E-commerce, SaaS, Consulting…"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-400 mt-1.5">Used to personalise your AI advisor&apos;s recommendations.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Company size
          </label>
          <select
            value={size} onChange={(e) => setSize(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select…</option>
            {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Primary currency
          </label>
          <select
            value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle size={14} />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
