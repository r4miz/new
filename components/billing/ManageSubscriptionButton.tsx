"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

interface Props {
  workspaceId: string
}

export function ManageSubscriptionButton({ workspaceId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to open portal")
      window.location.href = json.url
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div className="flex-shrink-0">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
