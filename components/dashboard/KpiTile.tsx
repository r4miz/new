"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, BarChart2, Hash, RefreshCw, AlertCircle } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
} from "recharts"

interface Props {
  kpi: KpiProposal
  workspaceSlug: string
}

type QueryRow = Record<string, unknown>

// Per-chart-type accent colours
const ACCENT = {
  line:   { iconBg: "bg-blue-50",    iconColor: "text-blue-500",   stroke: "#3b82f6", fill: "#3b82f6" },
  area:   { iconBg: "bg-violet-50",  iconColor: "text-violet-500", stroke: "#8b5cf6", fill: "#8b5cf6" },
  bar:    { iconBg: "bg-amber-50",   iconColor: "text-amber-500",  stroke: "#f59e0b", fill: "#f59e0b" },
  number: { iconBg: "bg-emerald-50", iconColor: "text-emerald-500",stroke: "#10b981", fill: "#10b981" },
} as const

function chartIcon(type: KpiProposal["chart_type"]) {
  if (type === "number") return <Hash size={15} />
  if (type === "bar")    return <BarChart2 size={15} />
  return <TrendingUp size={15} />
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
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-01`)
    return d.toLocaleString("default", { month: "short", year: "2-digit" })
  }
  return s.length > 12 ? s.slice(0, 11) + "…" : s
}

function trendPct(rows: QueryRow[], col: string): number | null {
  if (rows.length < 2) return null
  const vals = rows.map((r) => Number(r[col] ?? 0))
  const prev = vals[vals.length - 2]
  const curr = vals[vals.length - 1]
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows, setRows] = useState<QueryRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const cols      = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const numCol    = cols.find((c) => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const labelCol  = cols.find((c) => c !== numCol) ?? cols[0]
  const isScalar  = !rows || rows.length <= 1 || kpi.chart_type === "number"
  const trend     = rows && !isScalar ? trendPct(rows, numCol) : null
  const headlineVal = rows && rows.length > 0 ? rows[isScalar ? 0 : rows.length - 1][numCol] : null

  const chartData = rows?.map((r) => ({
    label: shortenLabel(r[labelCol]),
    value: Number(r[numCol] ?? 0),
  }))

  const gradId = `g-${kpi.id}`

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Top row: icon + name + trend badge + refresh */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl ${accent.iconBg} flex items-center justify-center flex-shrink-0 ${accent.iconColor}`}>
            {chartIcon(kpi.chart_type)}
          </div>
          <span className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {kpi.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {trend !== null && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              trend >= 0
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}>
              {trend >= 0
                ? <TrendingUp size={11} />
                : <TrendingDown size={11} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); fetchData() }}
            className="text-slate-300 hover:text-slate-500 transition-colors p-1"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Headline number */}
      {loading ? (
        <div className="space-y-2 mb-4">
          <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-50 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-1.5 text-red-600 text-xs bg-red-50 rounded-xl p-3 mb-3">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span className="font-mono break-all">{error}</span>
        </div>
      ) : (
        <div className="mb-3">
          <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {fmt(headlineVal)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {numCol.replace(/_/g, " ")}
          </div>
        </div>
      )}

      {/* Sparkline — hidden for number KPIs or errors */}
      {!loading && !error && rows && rows.length > 1 && kpi.chart_type !== "number" && (
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            {kpi.chart_type === "bar" ? (
              <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }} barCategoryGap="30%">
                <Bar dataKey="value" fill={accent.fill} radius={[2, 2, 0, 0]} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                  labelFormatter={String}
                />
              </BarChart>
            ) : kpi.chart_type === "area" ? (
              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={accent.fill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accent.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                  labelFormatter={String}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={accent.fill} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={accent.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2} dot={false} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(v: unknown) => [fmt(v), numCol.replace(/_/g, " ")]}
                  labelFormatter={String}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed mt-3 line-clamp-2">
        {kpi.description}
      </p>
    </Link>
  )
}
