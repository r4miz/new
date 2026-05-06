"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, BarChart2, Hash, RefreshCw, AlertCircle, ArrowRight } from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, Tooltip,
} from "recharts"

interface Props {
  kpi: KpiProposal
  workspaceSlug: string
}

type QueryRow = Record<string, unknown>

const GRADIENTS: Record<string, { from: string; to: string; glow: string }> = {
  line:   { from: "#1e3a8a", to: "#3b82f6", glow: "rgba(59,130,246,0.3)"  },
  area:   { from: "#3b0764", to: "#7c3aed", glow: "rgba(124,58,237,0.3)"  },
  bar:    { from: "#78350f", to: "#ea580c", glow: "rgba(234,88,12,0.3)"   },
  number: { from: "#064e3b", to: "#059669", glow: "rgba(5,150,105,0.3)"   },
}

const CHART_COLORS: Record<string, string> = {
  line: "#60a5fa", area: "#a78bfa", bar: "#fb923c", number: "#34d399",
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function shortenLabel(v: unknown): string {
  const s = String(v ?? "")
  const m = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m) return new Date(`${m[1]}-${m[2]}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
  return s.length > 10 ? s.slice(0, 9) + "…" : s
}

function trendPct(rows: QueryRow[], col: string): number | null {
  if (rows.length < 2) return null
  const vals = rows.map((r) => Number(r[col] ?? 0))
  const prev = vals[vals.length - 2], curr = vals[vals.length - 1]
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", backdropFilter: "blur(8px)" }}>
      <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "2px" }}>{label}</p>
      <p style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: 600 }}>{fmt(payload[0]?.value)}</p>
    </div>
  )
}

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows,    setRows]    = useState<QueryRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const grad  = GRADIENTS[kpi.chart_type] ?? GRADIENTS.line
  const color = CHART_COLORS[kpi.chart_type] ?? "#60a5fa"

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/kpis/${kpi.id}/execute`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Execute failed")
      setRows(json.rows as QueryRow[])
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [kpi.id])

  useEffect(() => { fetchData() }, [fetchData])

  const cols     = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const numCol   = cols.find((c) => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const labelCol = cols.find((c) => c !== numCol) ?? cols[0]
  const isScalar = kpi.chart_type === "number" || !rows || rows.length <= 1
  const trend    = rows && !isScalar ? trendPct(rows, numCol) : null
  const headline = rows && rows.length > 0 ? rows[isScalar ? 0 : rows.length - 1][numCol] : null
  const chartData = rows?.map((r) => ({ label: shortenLabel(r[labelCol]), value: Number(r[numCol] ?? 0) }))

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      className="group"
      style={{
        display: "block", textDecoration: "none",
        borderRadius: "16px", overflow: "hidden",
        background: "white",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(15,23,42,0.06)`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06)"
      }}
    >
      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)`,
        padding: "18px 18px 16px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative orb */}
        <div style={{
          position: "absolute", top: "-20px", right: "-20px",
          width: "80px", height: "80px", borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }} />

        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.65)", lineHeight: "1.3", flex: 1 }}>
            {kpi.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {trend !== null && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "3px",
                fontSize: "11px", fontWeight: 700,
                color: trend >= 0 ? "#bbf7d0" : "#fecaca",
                background: trend >= 0 ? "rgba(187,247,208,0.15)" : "rgba(254,202,202,0.15)",
                padding: "2px 7px", borderRadius: "99px",
              }}>
                {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            <button
              onClick={(e) => { e.preventDefault(); fetchData() }}
              style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex" }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Headline */}
        {loading ? (
          <div style={{ height: "36px", background: "rgba(255,255,255,0.12)", borderRadius: "8px", width: "120px" }} />
        ) : error ? (
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Query failed</div>
        ) : (
          <>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", lineHeight: 1, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>
              {fmt(headline)}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
              {(numCol ?? "").replace(/_/g, " ")}
            </div>
          </>
        )}
      </div>

      {/* Chart / body */}
      <div style={{ background: "white", padding: "0" }}>
        {loading && (
          <div style={{ height: "80px", background: "linear-gradient(to right, #f8fafc, #f1f5f9, #f8fafc)", animation: "pulse 1.5s infinite" }} />
        )}

        {!loading && error && (
          <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={13} color="#ef4444" />
            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{error.slice(0, 60)}</span>
          </div>
        )}

        {!loading && !error && rows && rows.length > 1 && kpi.chart_type !== "number" && (
          <div style={{ height: "80px", paddingTop: "4px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {kpi.chart_type === "bar" ? (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
                  <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} opacity={0.9} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`g-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#g-${kpi.id})`} dot={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && rows && (rows.length <= 1 || kpi.chart_type === "number") && (
          <div style={{ height: "60px" }} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 18px",
        borderTop: "1px solid rgba(15,23,42,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fafafa",
      }}>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          {!loading && !error && rows ? `${rows.length} data point${rows.length !== 1 ? "s" : ""}` : ""}
        </span>
        <span style={{
          fontSize: "11px", fontWeight: 600, color: "#3b82f6",
          display: "flex", alignItems: "center", gap: "3px",
          transition: "gap 0.15s",
        }}>
          View details
          <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  )
}
