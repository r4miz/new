"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Tooltip } from "recharts"

interface Props { kpi: KpiProposal; workspaceSlug: string }
type Row = Record<string, unknown>

const ACCENT: Record<string, string> = {
  line: "#0ea5e9", area: "#8b5cf6", bar: "#f59e0b", number: "#10b981",
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function shortLabel(v: unknown): string {
  const s = String(v ?? "")
  const m = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m) return new Date(`${m[1]}-${m[2]}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
  return s.length > 10 ? s.slice(0, 9) + "…" : s
}

function pctChange(rows: Row[], col: string): number | null {
  if (rows.length < 2) return null
  const v = rows.map(r => Number(r[col] ?? 0))
  const p = v[v.length - 2], c = v[v.length - 1]
  return p === 0 ? null : ((c - p) / Math.abs(p)) * 100
}

const Tip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: string }) =>
  active && payload?.length ? (
    <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px" }}>
      <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: "#f8fafc", fontSize: "14px", fontWeight: 700, margin: 0 }}>{fmt(payload[0]?.value)}</p>
    </div>
  ) : null

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows,    setRows]    = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const color  = ACCENT[kpi.chart_type] ?? "#0ea5e9"
  const gradId = `g-${kpi.id}`

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/kpis/${kpi.id}/execute`, { method: "POST" })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed")
      setRows(json.rows)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [kpi.id])

  useEffect(() => { load() }, [load])

  const cols    = rows?.length ? Object.keys(rows[0]) : []
  const numCol  = cols.find(c => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const lblCol  = cols.find(c => c !== numCol) ?? cols[0]
  const scalar  = kpi.chart_type === "number" || !rows || rows.length <= 1
  const pct     = rows && !scalar ? pctChange(rows, numCol) : null
  const headline = rows?.length ? rows[scalar ? 0 : rows.length - 1][numCol] : null
  const data    = rows?.map(r => ({ l: shortLabel(r[lblCol]), v: Number(r[numCol] ?? 0) }))

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      style={{
        display: "block", textDecoration: "none", borderRadius: "12px", overflow: "hidden",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateY(-2px)"
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ""
        el.style.boxShadow = ""
      }}
    >
      <div style={{
        background: "#0d1117",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px", overflow: "hidden",
        borderLeft: `3px solid ${color}`,
      }}>

        {/* Main */}
        <div style={{ padding: "20px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "16px" }}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" }}>
              {kpi.name}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {pct !== null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "12px", fontWeight: 700,
                  color: pct >= 0 ? "#34d399" : "#f87171",
                  background: pct >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                  border: `1px solid ${pct >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                  padding: "3px 8px", borderRadius: "99px",
                }}>
                  {pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(pct).toFixed(1)}%
                </span>
              )}
              <button
                onClick={e => { e.preventDefault(); load() }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: "2px", display: "flex" }}
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ height: "60px" }}>
              <div className="shimmer" style={{ height: "38px", width: "140px", borderRadius: "6px", marginBottom: "8px" }} />
              <div className="shimmer" style={{ height: "12px", width: "90px", borderRadius: "4px" }} />
            </div>
          ) : error ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(248,113,113,0.08)", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ fontSize: "12px", color: "#f87171" }}>Query failed</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "46px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-2px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {fmt(headline)}
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "5px" }}>
                {(numCol ?? "").replace(/_/g, " ")}
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        {!loading && !error && data && data.length > 1 && kpi.chart_type !== "number" && (
          <>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: "88px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {kpi.chart_type === "bar" ? (
                  <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="40%">
                    <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} opacity={0.8} />
                    <Tooltip content={<Tip />} cursor={false} />
                  </BarChart>
                ) : (
                  <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
                    <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#080c14",
        }}>
          <span style={{ fontSize: "12px", color: "#334155" }}>
            {!loading && !error && rows && rows.length > 1 ? `${rows.length} data points` : ""}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color }}>
            View details →
          </span>
        </div>
      </div>
    </Link>
  )
}
