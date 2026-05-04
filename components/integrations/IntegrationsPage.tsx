"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw, CheckCircle, AlertCircle, Clock,
  ExternalLink, Loader2, X, Sheet, ShoppingBag, Plus, Zap,
} from "lucide-react"
import type { Integration } from "@/lib/integrations/types"

interface Workspace { id: string; slug: string; name: string }
interface Props { workspace: Workspace; integrations: Integration[] }

// ── Provider metadata ──────────────────────────────────────────────────────
const PROVIDERS = {
  google_sheets: {
    name:   "Google Sheets",
    icon:   Sheet,
    color:  "text-green-600",
    bg:     "bg-green-50",
    border: "border-green-200",
    description: "Sync any spreadsheet directly into your dashboard. Data updates automatically.",
    badge:  "bg-green-100 text-green-700",
  },
  shopify: {
    name:   "Shopify",
    icon:   ShoppingBag,
    color:  "text-emerald-600",
    bg:     "bg-emerald-50",
    border: "border-emerald-200",
    description: "Pull orders, revenue, and fulfilment data from your Shopify store.",
    badge:  "bg-emerald-100 text-emerald-700",
  },
} as const

function StatusBadge({ status }: { status: Integration["status"] }) {
  if (status === "active") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle size={10} />Active
    </span>
  )
  if (status === "error") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertCircle size={10} />Error
    </span>
  )
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock size={10} />Pending
    </span>
  )
  return null
}

function timeAgo(ts: string | null): string {
  if (!ts) return "Never"
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60_000)         return "Just now"
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ── Google Sheets modal ────────────────────────────────────────────────────
function GoogleSheetsModal({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const [sheetUrl,     setSheetUrl]     = useState("")
  const [datasetName,  setDatasetName]  = useState("")
  const [loading,      setLoading]      = useState(false)

  function handleConnect() {
    if (!sheetUrl || !datasetName) return
    setLoading(true)
    const params = new URLSearchParams({
      workspace_id:  workspace.id,
      sheet_url:     sheetUrl,
      dataset_name:  datasetName,
    })
    window.location.href = `/api/integrations/google/auth?${params}`
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <Sheet size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Connect Google Sheets</h2>
              <p className="text-xs text-slate-500 mt-0.5">Syncs daily · stays fresh automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dataset name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g. Monthly Sales"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Google Sheets URL</label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1.5">Make sure your sheet has column headers in the first row.</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 leading-relaxed">
            <strong>What happens next:</strong> You&apos;ll be redirected to sign in with Google and grant read-only access to your spreadsheet. We never modify your data.
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading || !sheetUrl || !datasetName}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            {loading ? "Redirecting…" : "Connect with Google"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shopify modal ──────────────────────────────────────────────────────────
function ShopifyModal({ workspace, onClose, onSuccess }: { workspace: Workspace; onClose: () => void; onSuccess: () => void }) {
  const [shopUrl,      setShopUrl]      = useState("")
  const [accessToken,  setAccessToken]  = useState("")
  const [datasetName,  setDatasetName]  = useState("Shopify Orders")
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, shop_url: shopUrl, access_token: accessToken, dataset_name: datasetName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Connection failed")
      onSuccess()
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Connect Shopify</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pulls all orders · syncs daily</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dataset name</label>
            <input type="text" value={datasetName} onChange={(e) => setDatasetName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Store URL</label>
            <input type="text" value={shopUrl} onChange={(e) => setShopUrl(e.target.value)}
              placeholder="your-store.myshopify.com"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin API access token</label>
            <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
              placeholder="shpat_..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-700">How to get your access token:</p>
            <p>1. Shopify Admin → Apps → Develop apps → Create app</p>
            <p>2. Configure Admin API scopes: <code className="bg-slate-200 px-1 rounded">read_orders</code></p>
            <p>3. Install app → copy the Admin API access token</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-3">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading || !shopUrl || !accessToken}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {loading ? "Connecting & syncing…" : "Connect Shopify"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export function IntegrationsPage({ workspace, integrations: initial }: Props) {
  const router = useRouter()
  const [integrations, setIntegrations] = useState(initial)
  const [modal,        setModal]        = useState<"google" | "shopify" | null>(null)
  const [syncing,      setSyncing]      = useState<string | null>(null)

  const connectedProviders = new Set(integrations.map((i) => i.provider))

  async function handleSync(integrationId: string) {
    setSyncing(integrationId)
    try {
      await fetch(`/api/integrations/sync/${integrationId}`, { method: "POST" })
      router.refresh()
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Connect your data sources. Your dashboard updates automatically.
        </p>
      </div>

      {/* Available integrations */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Available</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(PROVIDERS) as [keyof typeof PROVIDERS, typeof PROVIDERS[keyof typeof PROVIDERS]][]).map(([key, p]) => {
            const Icon       = p.icon
            const isConnected = connectedProviders.has(key)

            return (
              <div key={key} className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 ${isConnected ? "border-slate-200" : "border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${p.bg} ${p.border} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={p.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{p.name}</h3>
                      {isConnected && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">Connected</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModal(key as "google" | "shopify")}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isConnected
                      ? "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
                      : `${p.bg} ${p.border} border ${p.color} hover:opacity-80`
                  }`}
                >
                  <Plus size={14} />
                  {isConnected ? "Add another" : "Connect"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Connected integrations */}
      {integrations.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Connected</h2>
          <div className="space-y-3">
            {integrations.map((intg) => {
              const p    = PROVIDERS[intg.provider]
              const Icon = p.icon

              return (
                <div key={intg.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className={`w-9 h-9 ${p.bg} ${p.border} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={17} className={p.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 text-sm truncate">{intg.name}</span>
                      <StatusBadge status={intg.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{p.name}</span>
                      <span>·</span>
                      <span>Last sync: {timeAgo(intg.last_synced_at)}</span>
                      <span>·</span>
                      <span className="capitalize">{intg.sync_frequency}</span>
                    </div>
                    {intg.last_error && (
                      <p className="text-xs text-red-500 mt-1 truncate">{intg.last_error}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSync(intg.id)}
                    disabled={syncing === intg.id}
                    title="Sync now"
                    className="flex-shrink-0 w-8 h-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={syncing === intg.id ? "animate-spin" : ""} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === "google" && (
        <GoogleSheetsModal workspace={workspace} onClose={() => setModal(null)} />
      )}
      {modal === "shopify" && (
        <ShopifyModal
          workspace={workspace}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); router.refresh() }}
        />
      )}
    </div>
  )
}
