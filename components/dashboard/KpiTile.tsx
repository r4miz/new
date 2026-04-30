"use client"

import { useState, useEffect, useCallback } from "react"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, AlertCircle, RefreshCw } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

interface Props {
  kpi: KpiProposal
}

type QueryRow = Record<string, unknown>

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (!isNaN(n)) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
  }
  return String(v)
}

function shortenLabel(v: unknown): string {
  const s = String(v ?? "")
  // ISO date: 2024-01-01 → Jan
  const dateMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    const d = new Date(`${dateMatch[1]}-${dateMatch[2]}-01`)
    return d.toLocaleString("default", { month: "short", year: "2-digit" })
  }
  return s.length > 10 ? s.slice(0, 10) + "…" : s
}

export function KpiTile({ kpi }: Props) {
  const [rows, setRows] = useState<QueryRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Derive display shape from results
  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const numericCol = columns.find((c) => typeof rows![0][c] === "number") ?? columns[columns.length - 1]
  const labelCol = columns.find((c) => c !== numericCol) ?? columns[0]
  const isScalar = rows?.length === 1

  const chartData = rows?.map((r) => ({
    label: shortenLabel(r[labelCol]),
    value: Number(r[numericCol] ?? 0),
  }))

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{kpi.name}</h3>
        </div>
        <button
          onClick={fetchData}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed">{kpi.description}</p>

      {/* Data area */}
      {loading && <div className="h-24 rounded-lg bg-slate-50 animate-pulse" />}

      {!loading && error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-xs">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span className="font-mono break-all">{error}</span>
        </div>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <>
          {isScalar ? (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                {formatValue(rows[0][numericCol])}
              </span>
              <span className="text-sm text-slate-400 mb-1">
                {numericCol.replace(/_/g, " ")}
              </span>
            </div>
          ) : (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                {kpi.chart_type === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e2e8f0" }}
                      formatter={(v: unknown) => [formatValue(v), numericCol.replace(/_/g, " ")]}
                      labelStyle={{ color: "#64748b" }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e2e8f0" }}
                      formatter={(v: unknown) => [formatValue(v), numericCol.replace(/_/g, " ")]}
                      labelStyle={{ color: "#64748b" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill={`url(#grad-${kpi.id})`}
                      dot={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <p className="text-xs text-slate-400">No data returned</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <span className="text-xs text-slate-400">
          {!loading && !error && rows ? `${rows.length} row${rows.length !== 1 ? "s" : ""}` : ""}
        </span>
        <span className="text-xs text-slate-400">
          {kpi.chart_type}
        </span>
      </div>
    </div>
  )
}
