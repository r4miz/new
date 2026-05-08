"use client"

import { useState, useEffect, useCallback } from "react"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, BarChart2, Hash, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface Props {
  kpi: KpiProposal
}

type QueryRow = Record<string, unknown>

const ACCENT = {
  line:   { stroke: "#0ea5e9", fill: "#0ea5e9" },
  area:   { stroke: "#8b5cf6", fill: "#8b5cf6" },
  bar:    { stroke: "#f59e0b", fill: "#f59e0b" },
  number: { stroke: "#10b981", fill: "#10b981" },
} as const

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function fmtFull(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(4)
}

function shortenLabel(v: unknown): string {
  const s = String(v ?? "")
  const m = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-01`)
    return d.toLocaleString("default", { month: "short", year: "2-digit" })
  }
  return s.length > 16 ? s.slice(0, 15) + "…" : s
}

function trendPct(rows: QueryRow[], col: string): number | null {
  if (rows.length < 2) return null
  const vals = rows.map((r) => Number(r[col] ?? 0))
  const prev = vals[vals.length - 2]
  const curr = vals[vals.length - 1]
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8,
  background: "#141d2e", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f8fafc", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
}

export function KpiDetail({ kpi }: Props) {
  const [rows, setRows] = useState<QueryRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sqlOpen, setSqlOpen] = useState(false)

  const accent = ACCENT[kpi.chart_type] ?? ACCENT.line

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/execute`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Execute failed")
      setRows(json.rows as QueryRow[])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [kpi.id])

  useEffect(() => { fetchData() }, [fetchData])

  const cols     = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const numCol   = cols.find((c) => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const labelCol = cols.find((c) => c !== numCol) ?? cols[0]
  const isScalar = !rows || rows.length <= 1 || kpi.chart_type === "number"
  const trend    = rows && !isScalar ? trendPct(rows, numCol) : null

  const nums  = rows?.map((r) => Number(r[numCol] ?? 0)).filter((n) => !isNaN(n)) ?? []
  const total = nums.reduce((a, b) => a + b, 0)
  const avg   = nums.length ? total / nums.length : 0
  const max   = nums.length ? Math.max(...nums) : 0
  const min   = nums.length ? Math.min(...nums) : 0

  const chartData = rows?.map((r) => ({
    label: shortenLabel(r[labelCol]),
    value: Number(r[numCol] ?? 0),
  }))

  const gradId = `detail-g-${kpi.id}`

  const chartIcon = kpi.chart_type === "number" ? <Hash size={18} />
    : kpi.chart_type === "bar" ? <BarChart2 size={18} />
    : <TrendingUp size={18} />

  const card: React.CSSProperties = {
    background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `rgba(${accent.fill === "#0ea5e9" ? "14,165,233" : accent.fill === "#8b5cf6" ? "139,92,246" : accent.fill === "#f59e0b" ? "245,158,11" : "16,185,129"},0.12)`,
            color: accent.stroke,
          }}>
            {chartIcon}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.3px" }}>{kpi.name}</h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>{kpi.description}</p>
          </div>
        </div>
        {trend !== null && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
            fontSize: "13px", fontWeight: 700, padding: "8px 14px", borderRadius: "10px",
            background: trend >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: trend >= 0 ? "#10b981" : "#ef4444",
            border: `1px solid ${trend >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend).toFixed(1)}% vs prev
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: "80px", borderRadius: "12px" }} />
            ))}
          </div>
          <div className="shimmer" style={{ height: "260px", borderRadius: "14px" }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#fca5a5", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "12px", padding: "16px" }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontFamily: "monospace" }}>{error}</span>
        </div>
      )}

      {/* Content */}
      {!loading && !error && rows && (
        <>
          {/* Stat pills */}
          {nums.length > 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "Total", value: fmt(total) },
                { label: "Average", value: fmt(avg) },
                { label: "Peak", value: fmt(max) },
                { label: "Floor", value: fmt(min) },
              ].map((s) => (
                <div key={s.label} style={{ ...card, padding: "16px 18px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#f8fafc", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scalar */}
          {isScalar && rows.length === 1 && (
            <div style={{ ...card, padding: "40px", textAlign: "center" }}>
              <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                {numCol.replace(/_/g, " ")}
              </p>
              <p style={{ margin: 0, fontSize: "56px", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: accent.stroke }}>
                {fmt(rows[0][numCol])}
              </p>
            </div>
          )}

          {/* Chart */}
          {!isScalar && rows.length > 1 && (
            <div style={{ ...card, padding: "20px" }}>
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {kpi.chart_type === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]} />
                      <Bar dataKey="value" fill={accent.fill} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : kpi.chart_type === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={accent.fill} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={accent.fill} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]} />
                      <Area type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]} />
                      <Line type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} dot={{ r: 3, fill: accent.stroke }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data table */}
          {rows.length > 0 && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>
                  Raw data <span style={{ fontWeight: 400, color: "#334155" }}>· {rows.length} rows</span>
                </p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#080c14" }}>
                      {cols.map((c) => (
                        <th key={c} style={{ textAlign: "left", padding: "10px 20px", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {c.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {cols.map((c) => (
                          <td key={c} style={{ padding: "10px 20px", color: "#94a3b8", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                            {typeof row[c] === "number" ? fmtFull(row[c]) : String(row[c] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 100 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", color: "#334155" }}>
                  Showing first 100 of {rows.length} rows
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SQL accordion */}
      <div style={{ ...card, overflow: "hidden" }}>
        <button
          onClick={() => setSqlOpen((o) => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#475569",
            background: "none", border: "none", cursor: "pointer", transition: "color 0.12s",
          }}
        >
          <span>SQL query</span>
          {sqlOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {sqlOpen && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <pre style={{ margin: 0, background: "#07090e", color: "#7dd3fc", fontSize: "12px", padding: "20px", overflowX: "auto", lineHeight: 1.65, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
              {kpi.proposed_sql}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
