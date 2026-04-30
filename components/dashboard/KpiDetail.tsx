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
  line:   { stroke: "#3b82f6", fill: "#3b82f6", light: "#eff6ff" },
  area:   { stroke: "#8b5cf6", fill: "#8b5cf6", light: "#f5f3ff" },
  bar:    { stroke: "#f59e0b", fill: "#f59e0b", light: "#fffbeb" },
  number: { stroke: "#10b981", fill: "#10b981", light: "#f0fdf4" },
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

  // Summary stats
  const nums = rows?.map((r) => Number(r[numCol] ?? 0)).filter((n) => !isNaN(n)) ?? []
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
            style={{ background: accent.light, color: accent.stroke }}>
            {chartIcon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{kpi.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{kpi.description}</p>
          </div>
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl flex-shrink-0 ${
            trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend).toFixed(1)}% vs prev
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-4">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* Content */}
      {!loading && !error && rows && (
        <>
          {/* Stat pills */}
          {nums.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: fmt(total) },
                { label: "Average", value: fmt(avg) },
                { label: "Peak", value: fmt(max) },
                { label: "Floor", value: fmt(min) },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scalar number */}
          {isScalar && rows.length === 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">{numCol.replace(/_/g, " ")}</p>
              <p className="text-5xl font-bold tabular-nums" style={{ color: accent.stroke }}>
                {fmt(rows[0][numCol])}
              </p>
            </div>
          )}

          {/* Full chart */}
          {!isScalar && rows.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {kpi.chart_type === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                      />
                      <Bar dataKey="value" fill={accent.fill} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : kpi.chart_type === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={accent.fill} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={accent.fill} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                      />
                      <Area type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                      />
                      <Line type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} dot={{ r: 3, fill: accent.stroke }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data table */}
          {rows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">
                  Raw data <span className="font-normal text-slate-400">· {rows.length} rows</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {cols.map((c) => (
                        <th key={c} className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {c.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        {cols.map((c) => (
                          <td key={c} className="px-5 py-2.5 text-slate-700 whitespace-nowrap tabular-nums">
                            {typeof row[c] === "number" ? fmtFull(row[c]) : String(row[c] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 100 && (
                <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                  Showing first 100 of {rows.length} rows
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SQL accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setSqlOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>SQL query</span>
          {sqlOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {sqlOpen && (
          <div className="border-t border-slate-100">
            <pre className="bg-slate-950 text-slate-300 text-xs p-5 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
              {kpi.proposed_sql}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
