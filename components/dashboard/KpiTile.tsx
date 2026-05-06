"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, Tooltip,
} from "recharts"

interface Props { kpi: KpiProposal; workspaceSlug: string }
type Row = Record<string, unknown>

const ACCENT: Record<string, string> = {
  line: "#0ea5e9", area: "#8b5cf6", bar: "#f59e0b", number: "#10b981",
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function label(v: unknown): string {
  const s = String(v ?? "")
  const m = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m) return new Date(`${m[1]}-${m[2]}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
  return s.length > 12 ? s.slice(0, 11) + "…" : s
}

function trend(rows: Row[], col: string): number | null {
  if (rows.length < 2) return null
  const v = rows.map(r => Number(r[col] ?? 0))
  const p = v[v.length - 2], c = v[v.length - 1]
  return p === 0 ? null : ((c - p) / Math.abs(p)) * 100
}

const Tip = ({ active, payload, label: l }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: string }) =>
  active && payload?.length ? (
    <div style={{ background: "#0f172a", border: "none", borderRadius: "6px", padding: "7px 11px" }}>
      <p style={{ color: "#94a3b8", fontSize: "11px", margin: "0 0 2px" }}>{l}</p>
      <p style={{ color: "#f8fafc", fontSize: "13px", fontWeight: 700, margin: 0 }}>{fmt(payload[0]?.value)}</p>
    </div>
  ) : null

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows,    setRows]    = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const color   = ACCENT[kpi.chart_type] ?? "#0ea5e9"
  const gradId  = `a-${kpi.id}`

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await (await fetch(`/api/kpis/${kpi.id}/execute`, { method: "POST" })).json()
      if (r.error) throw new Error(r.error)
      setRows(r.rows)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [kpi.id])

  useEffect(() => { fetch_() }, [fetch_])

  const cols    = rows?.length ? Object.keys(rows[0]) : []
  const numCol  = cols.find(c => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const lblCol  = cols.find(c => c !== numCol) ?? cols[0]
  const scalar  = kpi.chart_type === "number" || !rows || rows.length <= 1
  const pct     = rows && !scalar ? trend(rows, numCol) : null
  const val     = rows?.length ? rows[scalar ? 0 : rows.length - 1][numCol] : null
  const data    = rows?.map(r => ({ l: label(r[lblCol]), v: Number(r[numCol] ?? 0) }))

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      style={{ display: "block", textDecoration: "none", borderRadius: "10px", overflow: "hidden", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s, transform 0.15s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; el.style.transform = "translateY(-1px)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; el.style.transform = "none" }}
    >
      {/* Accent top bar */}
      <div style={{ height: "3px", background: color }} />

      {/* Header */}
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569", lineHeight: 1.4, flex: 1 }}>
            {kpi.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {pct !== null && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "3px",
                fontSize: "12px", fontWeight: 600,
                color: pct >= 0 ? "#059669" : "#dc2626",
                background: pct >= 0 ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${pct >= 0 ? "#bbf7d0" : "#fecaca"}`,
                padding: "2px 8px", borderRadius: "99px",
              }}>
                {pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(pct).toFixed(1)}%
              </span>
            )}
            <button
              onClick={e => { e.preventDefault(); fetch_() }}
              style={{ color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", borderRadius: "4px" }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Value */}
        {loading ? (
          <div style={{ height: "40px", background: "#f8fafc", borderRadius: "6px", width: "130px" }} />
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626" }}>
            <AlertCircle size={13} />
            <span style={{ fontSize: "12px", fontFamily: "monospace" }}>Query failed</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {fmt(val)}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
              {(numCol ?? "").replace(/_/g, " ")}
            </div>
          </>
        )}
      </div>

      {/* Sparkline */}
      {!loading && !error && data && data.length > 1 && kpi.chart_type !== "number" && (
        <div style={{ height: "72px" }}>
          <ResponsiveContainer width="100%" height="100%">
            {kpi.chart_type === "bar" ? (
              <BarChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }} barCategoryGap="35%">
                <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} opacity={0.85} />
                <Tooltip content={<Tip />} cursor={false} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${gradId})`} dot={false} />
                <Tooltip content={<Tip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "10px 20px", background: "#fafafa",
        borderTop: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
          {!loading && !error && rows ? `${rows.length} data point${rows.length !== 1 ? "s" : ""}` : ""}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: color }}>
          View details →
        </span>
      </div>
    </Link>
  )
}
