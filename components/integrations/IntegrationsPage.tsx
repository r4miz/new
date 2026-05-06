"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw, CheckCircle, AlertCircle, Clock,
  Loader2, X, Plus, Zap, ExternalLink,
} from "lucide-react"
import type { Integration } from "@/lib/integrations/types"

interface Workspace { id: string; slug: string; name: string }
interface Props { workspace: Workspace; integrations: Integration[] }

// ── SVG brand icons ─────────────────────────────────────────────────────────
const GoogleSheetsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" fill="#0F9D58"/>
    <path d="M8 8h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8z" fill="#fff"/>
  </svg>
)
const ShopifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M15.337 23.979l6.032-1.302S18.591 7.514 18.57 7.37c-.021-.143-.143-.25-.286-.25-.132 0-2.452-.05-2.452-.05s-1.637-1.578-1.81-1.75v18.66z" fill="#95BF47"/>
    <path d="M12.977 5.75s-1.012-.286-2.262-.286c-2.394 0-3.546 1.476-3.546 2.906 0 1.595 1.238 2.417 2.37 3.023 1.059.573 1.429 1.024 1.429 1.621 0 .8-.715 1.19-1.525 1.19-.963 0-2.07-.536-2.07-.536l-.31 1.857s.906.536 2.513.536c2.334 0 3.678-1.154 3.678-3.14 0-1.617-1.131-2.512-2.238-3.118C9.905 9.306 9.57 8.9 9.57 8.278c0-.572.381-1.12 1.333-1.12.643 0 1.572.321 1.572.321L12.977 5.75z" fill="#5E8E3E"/>
    <path d="M18.57 7.37c-.132 0-2.452-.05-2.452-.05s-1.637-1.578-1.81-1.75c-.072-.071-.179-.1-.286-.1l-1.046 18.51L21.369 22.677z" fill="#5E8E3E"/>
  </svg>
)
const WooIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M22 0H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h8l2 4 2-4h8c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" fill="#7F54B3"/>
    <path d="M2.2 5.7C2.7 5.1 3.4 4.8 4.3 4.8c.8 0 1.5.3 1.9.8.4.5.6 1.2.4 2l-1 4.9c-.1.5-.4 1-.8 1.3-.4.3-.9.4-1.4.3-.5-.1-.9-.4-1.2-.9-.2-.4-.3-.9-.2-1.4l.9-4.1c.1-.4.1-.7.3-1zm7.1 0c.5-.6 1.2-.9 2.1-.9.8 0 1.5.3 1.9.8.4.5.6 1.2.4 2l-1 4.9c-.1.5-.4 1-.8 1.3-.4.3-.9.4-1.4.3-.5-.1-.9-.4-1.2-.9-.2-.4-.3-.9-.2-1.4l.9-4.1c.1-.4.2-.7.3-1zm7.4 0c.4-.5 1-.8 1.7-.8.9 0 1.6.4 2.1 1.1.5.7.6 1.6.4 2.5l-.6 3.1c-.2.9-.6 1.6-1.3 2.1-.6.5-1.4.7-2.1.5-.8-.2-1.4-.7-1.7-1.4-.3-.7-.4-1.5-.2-2.3l.6-3.1c.2-.7.6-1.3 1.1-1.7z" fill="#fff"/>
  </svg>
)
const HubSpotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF7A59">
    <path d="M18.164 7.93V5.084a1.72 1.72 0 001.005-1.554v-.052A1.722 1.722 0 0017.45 1.76h-.052a1.722 1.722 0 00-1.72 1.718v.052c0 .7.416 1.304 1.005 1.554V7.93a4.872 4.872 0 00-2.315 1.015l-7.8-6.067a1.9 1.9 0 00.073-.49 1.914 1.914 0 10-1.915 1.913 1.9 1.9 0 00.957-.262l7.68 5.976a4.856 4.856 0 00-.785 2.674 4.873 4.873 0 001.247 3.26L12.41 17.71a1.688 1.688 0 00-.475-.072 1.71 1.71 0 101.71 1.71 1.707 1.707 0 00-.282-.94l1.4-1.757A4.904 4.904 0 0021.44 12.7a4.879 4.879 0 00-3.276-4.77z"/>
  </svg>
)
const StripeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#635BFF">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
  </svg>
)
const AirtableIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M12 0L1.5 4.5v6L12 15l10.5-4.5v-6L12 0z" fill="#FCB400"/>
    <path d="M12 15v9L1.5 19.5V10.5L12 15z" fill="#18BFFF"/>
    <path d="M12 15v9l10.5-4.5V10.5L12 15z" fill="#F82B60"/>
  </svg>
)
const QuickBooksIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#2CA01C">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 17.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm0-9a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.5 2h1a2 2 0 010 4h-1v-4z"/>
  </svg>
)
const XeroIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#13B5EA">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.76 15.537l-2.56-2.56-2.56 2.56-.97-.97 2.56-2.56-2.56-2.56.97-.97 2.56 2.56 2.56-2.56.97.97-2.56 2.56 2.56 2.56-.97.97zm6.49.19a3.327 3.327 0 110-6.654 3.327 3.327 0 010 6.654zm0-5.32a1.994 1.994 0 100 3.989 1.994 1.994 0 000-3.989z"/>
  </svg>
)

// ── Provider registry ────────────────────────────────────────────────────────
type ProviderKey = "google_sheets" | "shopify" | "woocommerce" | "hubspot" | "stripe_data" | "airtable" | "quickbooks" | "xero"

interface ProviderMeta {
  name:        string
  Icon:        React.ComponentType
  description: string
  accentColor: string
  borderColor: string
  bgColor:     string
  comingSoon?: boolean
  fields:      Array<{ key: string; label: string; type?: string; placeholder?: string; hint?: string }>
  endpoint:    string
  bodyBuilder: (vals: Record<string, string>, workspaceId: string) => Record<string, string>
}

const PROVIDERS: Record<ProviderKey, ProviderMeta> = {
  google_sheets: {
    name: "Google Sheets", Icon: GoogleSheetsIcon,
    description: "Sync any spreadsheet directly. First row must be column headers.",
    accentColor: "text-green-700", borderColor: "border-green-200", bgColor: "bg-green-50",
    fields: [
      { key: "dataset_name", label: "Dataset name", placeholder: "e.g. Monthly Sales" },
      { key: "sheet_url",    label: "Sheet URL",    placeholder: "https://docs.google.com/spreadsheets/d/..." },
    ],
    endpoint: "", // OAuth — handled separately
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  shopify: {
    name: "Shopify", Icon: ShopifyIcon,
    description: "Pull all orders, revenue and fulfilment data from your store.",
    accentColor: "text-green-800", borderColor: "border-green-300", bgColor: "bg-green-50",
    fields: [
      { key: "dataset_name",  label: "Dataset name",       placeholder: "Shopify Orders" },
      { key: "shop_url",      label: "Store URL",           placeholder: "your-store.myshopify.com" },
      { key: "access_token",  label: "Admin API token",     type: "password", placeholder: "shpat_...", hint: "Admin → Apps → Develop apps → Create app → API access token" },
    ],
    endpoint: "/api/integrations/shopify/connect",
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  woocommerce: {
    name: "WooCommerce", Icon: WooIcon,
    description: "Import orders from your WooCommerce store via the REST API.",
    accentColor: "text-purple-700", borderColor: "border-purple-200", bgColor: "bg-purple-50",
    fields: [
      { key: "dataset_name",    label: "Dataset name",     placeholder: "WooCommerce Orders" },
      { key: "store_url",       label: "Store URL",        placeholder: "https://yourstore.com" },
      { key: "consumer_key",    label: "Consumer key",     type: "password", placeholder: "ck_...", hint: "WooCommerce → Settings → Advanced → REST API → Add key" },
      { key: "consumer_secret", label: "Consumer secret",  type: "password", placeholder: "cs_..." },
    ],
    endpoint: "/api/integrations/woocommerce/connect",
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  hubspot: {
    name: "HubSpot", Icon: HubSpotIcon,
    description: "Sync your deals pipeline — amounts, stages, close dates.",
    accentColor: "text-orange-700", borderColor: "border-orange-200", bgColor: "bg-orange-50",
    fields: [
      { key: "dataset_name",  label: "Dataset name",         placeholder: "HubSpot Deals" },
      { key: "access_token",  label: "Private app token",    type: "password", placeholder: "pat-na1-...", hint: "HubSpot → Settings → Integrations → Private Apps → Create app" },
    ],
    endpoint: "/api/integrations/hubspot/connect",
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  stripe_data: {
    name: "Stripe", Icon: StripeIcon,
    description: "Pull payment data, revenue, and transaction history.",
    accentColor: "text-indigo-700", borderColor: "border-indigo-200", bgColor: "bg-indigo-50",
    fields: [
      { key: "dataset_name", label: "Dataset name", placeholder: "Stripe Payments" },
      { key: "secret_key",   label: "Secret key",   type: "password", placeholder: "sk_live_...", hint: "Stripe Dashboard → Developers → API keys → Secret key" },
    ],
    endpoint: "/api/integrations/stripe-data/connect",
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  airtable: {
    name: "Airtable", Icon: AirtableIcon,
    description: "Sync any Airtable base and table as a dataset.",
    accentColor: "text-yellow-700", borderColor: "border-yellow-200", bgColor: "bg-yellow-50",
    fields: [
      { key: "dataset_name", label: "Dataset name", placeholder: "Airtable Data" },
      { key: "base_url",     label: "Table URL",    placeholder: "https://airtable.com/appXXX/tblXXX" },
      { key: "token",        label: "Personal access token", type: "password", placeholder: "pat...", hint: "Airtable → Account → Developer hub → Personal access tokens" },
    ],
    endpoint: "/api/integrations/airtable/connect",
    bodyBuilder: (v, wid) => ({ workspace_id: wid, ...v }),
  },
  quickbooks: {
    name: "QuickBooks", Icon: QuickBooksIcon, comingSoon: true,
    description: "Sync your P&L, invoices, and expense data.",
    accentColor: "text-green-700", borderColor: "border-green-200", bgColor: "bg-green-50",
    fields: [], endpoint: "", bodyBuilder: () => ({}),
  },
  xero: {
    name: "Xero", Icon: XeroIcon, comingSoon: true,
    description: "Sync accounting data, invoices and bank feeds.",
    accentColor: "text-sky-700", borderColor: "border-sky-200", bgColor: "bg-sky-50",
    fields: [], endpoint: "", bodyBuilder: () => ({}),
  },
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Integration["status"] }) {
  const cfg = {
    active:  { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle },
    error:   { label: "Error",    cls: "bg-red-50 text-red-600 border-red-200",             Icon: AlertCircle },
    pending: { label: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200",       Icon: Clock },
    paused:  { label: "Paused",   cls: "bg-slate-50 text-slate-500 border-slate-200",       Icon: Clock },
  }[status] ?? { label: status, cls: "bg-slate-50 text-slate-500 border-slate-200", Icon: Clock }
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

function timeAgo(ts: string | null): string {
  if (!ts) return "Never"
  const d = Date.now() - new Date(ts).getTime()
  if (d < 60_000) return "Just now"
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

// ── Connect modal ─────────────────────────────────────────────────────────────
function ConnectModal({ providerKey, workspace, onClose, onSuccess }: {
  providerKey: ProviderKey; workspace: Workspace; onClose: () => void; onSuccess: () => void
}) {
  const meta = PROVIDERS[providerKey]
  const { Icon } = meta
  const [vals,    setVals]    = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Google Sheets uses OAuth redirect
  if (providerKey === "google_sheets") {
    const sheetUrl    = vals.sheet_url ?? ""
    const datasetName = vals.dataset_name ?? ""
    function handleGoogleConnect() {
      setLoading(true)
      const p = new URLSearchParams({ workspace_id: workspace.id, sheet_url: sheetUrl, dataset_name: datasetName })
      window.location.href = `/api/integrations/google/auth?${p}`
    }
    return (
      <ModalShell meta={meta} onClose={onClose}>
        {meta.fields.map((f) => (
          <FieldInput key={f.key} field={f} value={vals[f.key] ?? ""} onChange={(v) => setVals(p => ({ ...p, [f.key]: v }))} />
        ))}
        <button onClick={handleGoogleConnect} disabled={loading || !sheetUrl || !datasetName}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
          {loading ? "Redirecting…" : "Connect with Google"}
        </button>
      </ModalShell>
    )
  }

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(meta.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta.bodyBuilder(vals, workspace.id)),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Connection failed")
      onSuccess()
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  const canConnect = meta.fields.filter((f) => f.key !== "dataset_name").every((f) => (vals[f.key] ?? "").trim().length > 0)

  return (
    <ModalShell meta={meta} onClose={onClose}>
      {meta.fields.map((f) => (
        <FieldInput key={f.key} field={f} value={vals[f.key] ?? ""} onChange={(v) => setVals(p => ({ ...p, [f.key]: v }))} />
      ))}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-3 border border-red-100">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <button onClick={handleConnect} disabled={loading || !canConnect}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
        {loading ? "Connecting & syncing…" : `Connect ${meta.name}`}
      </button>
    </ModalShell>
  )
}

function ModalShell({ meta, onClose, children }: { meta: ProviderMeta; onClose: () => void; children: React.ReactNode }) {
  const { Icon } = meta
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${meta.bgColor} border ${meta.borderColor} rounded-xl flex items-center justify-center`}>
              <Icon />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Connect {meta.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Syncs daily · stays fresh automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange }: { field: ProviderMeta["fields"][0]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{field.label}</label>
      <input
        type={field.type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${field.type === "password" ? "font-mono" : ""}`}
      />
      {field.hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{field.hint}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function IntegrationsPage({ workspace, integrations: initial }: Props) {
  const router = useRouter()
  const [integrations, setIntegrations] = useState(initial)
  const [modal,        setModal]        = useState<ProviderKey | null>(null)
  const [syncing,      setSyncing]      = useState<string | null>(null)

  async function handleSync(id: string) {
    setSyncing(id)
    await fetch(`/api/integrations/sync/${id}`, { method: "POST" })
    setSyncing(null)
    router.refresh()
  }

  const availableProviders = (Object.keys(PROVIDERS) as ProviderKey[]).filter((k) => !PROVIDERS[k].comingSoon)
  const comingSoon         = (Object.keys(PROVIDERS) as ProviderKey[]).filter((k) => PROVIDERS[k].comingSoon)

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Connect your data sources. Your dashboard stays fresh automatically.</p>
      </div>

      {/* Available integrations */}
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Available</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {availableProviders.map((key) => {
          const meta    = PROVIDERS[key]
          const { Icon } = meta
          const connected = integrations.some((i) => i.provider === key)
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${meta.bgColor} border ${meta.borderColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{meta.name}</p>
                    {connected && <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">Connected</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.description}</p>
                </div>
              </div>
              <button onClick={() => setModal(key)}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  connected ? "border border-slate-200 text-slate-500 hover:bg-slate-50" : `${meta.bgColor} border ${meta.borderColor} ${meta.accentColor} hover:opacity-80`
                }`}>
                <Plus size={12} />
                {connected ? "Add another" : "Connect"}
              </button>
            </div>
          )
        })}

        {/* Coming soon */}
        {comingSoon.map((key) => {
          const meta = PROVIDERS[key]
          const { Icon } = meta
          return (
            <div key={key} className="bg-white border border-slate-100 rounded-2xl p-4 opacity-60 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${meta.bgColor} border ${meta.borderColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900">{meta.name}</p>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Coming soon</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                </div>
              </div>
              <div className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 text-center">
                Coming soon
              </div>
            </div>
          )
        })}
      </div>

      {/* Connected integrations */}
      {integrations.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Connected</h2>
          <div className="space-y-3">
            {integrations.map((intg) => {
              const meta  = PROVIDERS[intg.provider as ProviderKey]
              const { Icon } = meta ?? { Icon: () => null }
              return (
                <div key={intg.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className={`w-9 h-9 ${meta?.bgColor} border ${meta?.borderColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{intg.name}</span>
                      <StatusBadge status={intg.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{meta?.name}</span>
                      <span>·</span>
                      <span>Last sync: {timeAgo(intg.last_synced_at)}</span>
                      <span>·</span>
                      <span className="capitalize">{intg.sync_frequency}</span>
                    </div>
                    {intg.last_error && <p className="text-xs text-red-500 mt-1 truncate">{intg.last_error}</p>}
                  </div>
                  <button onClick={() => handleSync(intg.id)} disabled={syncing === intg.id} title="Sync now"
                    className="flex-shrink-0 w-8 h-8 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                    <RefreshCw size={13} className={syncing === intg.id ? "animate-spin" : ""} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {modal && !PROVIDERS[modal]?.comingSoon && (
        <ConnectModal
          providerKey={modal}
          workspace={workspace}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); router.refresh() }}
        />
      )}
    </div>
  )
}
