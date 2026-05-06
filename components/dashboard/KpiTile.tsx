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

const TYPE_COLOR: Record<string, string> = {
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

function trendPct(rows: Row[], col: string): number | null {
  if (rows.length < 2) return null
  const v = rows.map(r => Number(r[col] ?? 0))
  const p = v[v.length - 2], c = v[v.length - 1]
  return p === 0 ? null : ((c - p) / Math.abs(p)) * 100
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: string }) =>
  active && payload?.length ? (
    <div style={{ background: "#1e293b", borderRadius: "6px", padding: "8px 12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
      <p style={{ color: "#94a3b8", fontSize: "11px", margin: "0 0 3px", fontWeight: 500 }}>{label}</p>
      <p style={{ color: "#f8fafc", fontSize: "14px", fontWeight: 700, margin: 0 }}>{fmt(payload[0]?.value)}</p>
    </div>
  ) : null

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows,    setRows]    = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const color  = TYPE_COLOR[kpi.chart_type] ?? "#0ea5e9"
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
  const pct     = rows && !scalar ? trendPct(rows, numCol) : null
  const headline = rows?.length ? rows[scalar ? 0 : rows.length - 1][numCol] : null
  const data    = rows?.map(r => ({ l: shortLabel(r[lblCol]), v: Number(r[numCol] ?? 0) }))

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      style={{ display: "block", textDecoration: "none", position: "relative" }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateY(-2px)"
        el.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "none"
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)"
      }}
    >
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        borderLeft: `4px solid ${color}`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}>

        {/* Main content */}
        <div style={{ padding: "22px 22px 16px" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px", gap: "12px" }}>
            <p style={{
              margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#9ca3af",
            }}>
              {kpi.name}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {pct !== null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "12px", fontWeight: 700,
                  color: pct >= 0 ? "#059669" : "#dc2626",
                  background: pct >= 0 ? "#ecfdf5" : "#fef2f2",
                  border: `1px solid ${pct >= 0 ? "#a7f3d0" : "#fecaca"}`,
                  padding: "3px 9px", borderRadius: "20px",
                }}>
                  {pct >= 0 ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
                  {Math.abs(pct).toFixed(1)}%
                </span>
              )}
              <button
                onClick={e => { e.preventDefault(); load() }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#d1d5db", display: "flex", borderRadius: "4px", transition: "color 0.12s" }}
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Metric value */}
          {loading ? (
            <div style={{ height: "52px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ height: "36px", width: "140px", background: "#f3f4f6", borderRadius: "6px" }} />
              <div style={{ height: "14px", width: "80px", background: "#f9fafb", borderRadius: "4px" }} />
            </div>
          ) : error ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#fef2f2", borderRadius: "8px" }}>
              <AlertCircle size={14} color="#dc2626" />
              <span style={{ fontSize: "12px", color: "#b91c1c" }}>Query failed — check the SQL</span>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: "48px", fontWeight: 800, color: "#0f172a",
                letterSpacing: "-2px", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmt(headline)}
              </div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px", fontWeight: 400 }}>
                {(numCol ?? "").replace(/_/g, " ")}
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        {!loading && !error && data && data.length > 1 && kpi.chart_type !== "number" && (
          <>
            <div style={{ height: "1px", background: "#f3f4f6" }} />
            <div style={{ height: "96px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {kpi.chart_type === "bar" ? (
                  <BarChart data={data} margin={{ top: 8, right: 2, left: 2, bottom: 0 }} barCategoryGap="40%">
                    <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} opacity={0.9} />
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                  </BarChart>
                ) : (
                  <AreaChart data={data} margin={{ top: 8, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"   stopColor={color} stopOpacity={0.18} />
                        <stop offset="95%"  stopColor={color} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 3, fill: color }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "4 2" }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #f3f4f6",
          padding: "11px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fafafa",
        }}>
          <span style={{ fontSize: "12px", color: "#d1d5db" }}>
            {!loading && !error && rows && rows.length > 1 ? `${rows.length} data points` : ""}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: color }}>
            View details →
          </span>
        </div>
      </div>
    </Link>
  )
}
