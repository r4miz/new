"use client"

import { useState, useEffect, useCallback } from "react"
import type { KpiProposal } from "@/lib/types"
import { T } from "@/lib/theme"
import {
  TrendingUp, TrendingDown, BarChart2, Hash, AlertCircle,
  RefreshCw, Award, Minus,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts"

interface Props { kpi: KpiProposal }
type Row = Record<string, unknown>

const ACCENT = {
  line:   { stroke: T.accent,  fill: T.accent  },
  area:   { stroke: T.purple,  fill: T.purple   },
  bar:    { stroke: T.amber,   fill: T.amber    },
  number: { stroke: T.green,   fill: T.green    },
} as const

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(v: unknown, full = false): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (full) return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function label(v: unknown): string {
  const s = String(v ?? "")
  // YYYY-MM → "Jan '25"
  const m1 = s.match(/^(\d{4})-(\d{2})$/)
  if (m1) return new Date(`${m1[1]}-${m1[2]}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
  // YYYY-MM-DD → "Jan '25"
  const m2 = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m2) return new Date(`${m2[1]}-${m2[2]}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
  return s.length > 18 ? s.slice(0, 17) + "…" : s
}

function pctChange(a: number, b: number): number | null {
  if (a === 0) return null
  return ((b - a) / Math.abs(a)) * 100
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: T.surface2, border: `1px solid ${T.border}`,
      borderRadius: "12px", padding: "18px 20px",
    }}>
      <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
        {value}
      </p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "11px", color: T.textDim }}>{sub}</p>}
    </div>
  )
}

const TIP_STYLE: React.CSSProperties = {
  background: T.surface2, border: `1px solid ${T.borderMd}`,
  borderRadius: "8px", fontSize: "12px", color: T.text,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
}

function Insight({ icon, text, positive }: { icon: React.ReactNode; text: string; positive?: boolean | null }) {
  const color = positive === true ? T.green : positive === false ? T.red : T.textSec
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{
        width: "24px", height: "24px", borderRadius: "6px", flexShrink: 0, marginTop: "1px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}18`, color,
      }}>
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: "13px", color: T.textSec, lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function KpiDetail({ kpi }: Props) {
  const [rows,    setRows]    = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const accent = ACCENT[kpi.chart_type as keyof typeof ACCENT] ?? ACCENT.line

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/kpis/${kpi.id}/execute`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Execute failed")
      setRows(json.rows as Row[])
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [kpi.id])

  useEffect(() => { load() }, [load])

  // ── Derived data ──────────────────────────────────────────────────────────
  const cols    = rows?.length ? Object.keys(rows[0]) : []
  const numCol  = cols.find(c => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const lblCol  = cols.find(c => c !== numCol) ?? cols[0]
  const isNum   = kpi.chart_type === "number" || !rows || rows.length <= 1

  const nums    = rows?.map(r => Number(r[numCol] ?? 0)).filter(n => !isNaN(n)) ?? []
  const total   = nums.reduce((a, b) => a + b, 0)
  const avg     = nums.length ? total / nums.length : 0
  const peak    = nums.length ? Math.max(...nums) : 0
  const floor   = nums.length ? Math.min(...nums) : 0
  const overall = pctChange(nums[0] ?? 0, nums[nums.length - 1] ?? 0)

  const chartData = rows?.map(r => ({
    label: label(r[lblCol]),
    rawLabel: String(r[lblCol] ?? ""),
    value: Number(r[numCol] ?? 0),
  })) ?? []

  const gradId = `g-${kpi.id}`

  // Sorted for table (keep original order for time-series, sort by value for bar)
  const isTimeSeries = kpi.chart_type === "line" || kpi.chart_type === "area"
  const tableRows = isTimeSeries
    ? (rows ?? [])
    : [...(rows ?? [])].sort((a, b) => Number(b[numCol] ?? 0) - Number(a[numCol] ?? 0))

  // Auto insights
  const insights: Array<{ icon: React.ReactNode; text: string; positive?: boolean | null }> = []

  if (!isNum && rows && rows.length >= 2) {
    if (isTimeSeries && overall !== null) {
      const dir = overall >= 0 ? "up" : "down"
      insights.push({
        icon: overall >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
        text: `${kpi.name} is trending ${dir} ${Math.abs(overall).toFixed(1)}% from the first period to the latest — ${overall >= 0 ? "positive momentum" : "needs attention"}.`,
        positive: overall >= 0,
      })
    }

    if (!isTimeSeries) {
      const best  = tableRows[0]
      const worst = tableRows[tableRows.length - 1]
      const bestPct  = total > 0 ? (Number(best[numCol]) / total * 100).toFixed(1) : "—"
      const worstPct = total > 0 ? (Number(worst[numCol]) / total * 100).toFixed(1) : "—"
      insights.push({
        icon: <Award size={13} />,
        text: `Top performer: ${String(best[lblCol])} at ${fmt(best[numCol])} (${bestPct}% of total). Leading by ${fmt(Number(best[numCol]) - Number(tableRows[1]?.[numCol] ?? 0))} over second place.`,
        positive: true,
      })
      insights.push({
        icon: <TrendingDown size={13} />,
        text: `Lowest performer: ${String(worst[lblCol])} at ${fmt(worst[numCol])} (${worstPct}% of total) — ${((1 - Number(worst[numCol]) / Number(best[numCol])) * 100).toFixed(0)}% below the top performer.`,
        positive: false,
      })
    }

    if (nums.length > 2) {
      const aboveAvg = tableRows.filter(r => Number(r[numCol] ?? 0) >= avg).length
      insights.push({
        icon: <Minus size={13} />,
        text: `Average ${numCol.replace(/_/g, " ")}: ${fmt(avg)}. ${aboveAvg} of ${rows.length} ${isTimeSeries ? "periods" : "entries"} are at or above average.`,
        positive: null,
      })
    }

    // Month-over-month for time series
    if (isTimeSeries && nums.length >= 2) {
      const lastChange = pctChange(nums[nums.length - 2], nums[nums.length - 1])
      if (lastChange !== null) {
        insights.push({
          icon: lastChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
          text: `Most recent period-over-period change: ${lastChange >= 0 ? "+" : ""}${lastChange.toFixed(1)}% (${fmt(nums[nums.length - 2])} → ${fmt(nums[nums.length - 1])}).`,
          positive: lastChange >= 0,
        })
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "12px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${accent.fill}18`, color: accent.stroke,
          }}>
            {kpi.chart_type === "number" ? <Hash size={20} /> : kpi.chart_type === "bar" ? <BarChart2 size={20} /> : <TrendingUp size={20} />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: T.text, letterSpacing: "-0.4px" }}>
              {kpi.name}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: T.textDim, maxWidth: "600px" }}>
              {kpi.description}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {overall !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 700, padding: "8px 14px", borderRadius: "10px",
              background: overall >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: overall >= 0 ? T.green : T.red,
              border: `1px solid ${overall >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              {overall >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(overall).toFixed(1)}% overall
            </div>
          )}
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: T.surface2, border: `1px solid ${T.borderMd}`,
            borderRadius: "8px", padding: "8px 14px", cursor: "pointer",
            fontSize: "12px", fontWeight: 600, color: T.textSec,
          }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: "88px", borderRadius: "12px" }} />)}
          </div>
          <div className="shimmer" style={{ height: "360px", borderRadius: "14px" }} />
          <div className="shimmer" style={{ height: "240px", borderRadius: "14px" }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px", padding: "18px",
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: "12px", fontSize: "13px", color: "#fca5a5",
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {!loading && !error && rows && (
        <>
          {/* ── Stat cards ─────────────────────────────────────────────────── */}
          {isNum && rows.length === 1 ? (
            /* Single scalar value */
            <div style={{
              ...card, padding: "48px", textAlign: "center",
              background: `linear-gradient(135deg, ${T.surface} 0%, ${T.surface2} 100%)`,
            }}>
              <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {numCol.replace(/_/g, " ")}
              </p>
              <p style={{
                margin: 0, fontSize: "72px", fontWeight: 900, fontVariantNumeric: "tabular-nums",
                letterSpacing: "-3px", lineHeight: 1,
                background: `linear-gradient(135deg, ${accent.stroke}, ${accent.stroke}99)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {fmt(rows[0][numCol])}
              </p>
              <p style={{ margin: "16px 0 0", fontSize: "13px", color: T.textDim }}>
                Calculated from your dataset
              </p>
            </div>
          ) : nums.length > 1 ? (
            /* Multi-value stat grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <StatCard title="Total" value={fmt(total)} sub={`across ${nums.length} ${isTimeSeries ? "periods" : "entries"}`} />
              <StatCard title="Average" value={fmt(avg)} sub="per period/entry" />
              <StatCard title="Peak" value={fmt(peak)} sub={isTimeSeries ? `highest period` : `top performer`} />
              <StatCard title="Floor" value={fmt(floor)} sub={isTimeSeries ? `lowest period` : `bottom performer`} />
            </div>
          ) : null}

          {/* ── Full chart ──────────────────────────────────────────────────── */}
          {!isNum && chartData.length > 1 && (
            <div style={{ ...card, padding: "24px 20px 16px" }}>
              <p style={{ margin: "0 0 20px", fontSize: "13px", fontWeight: 600, color: T.textSec }}>
                {numCol.replace(/_/g, " ")}
              </p>
              <div style={{ height: "340px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {kpi.chart_type === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent.fill} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={accent.fill} stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textDim }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: T.textDim }} tickLine={false} axisLine={false} width={70} />
                      <ReferenceLine y={avg} stroke={T.textDim} strokeDasharray="4 4" label={{ value: "avg", position: "right", fontSize: 10, fill: T.textDim }} />
                      <Tooltip contentStyle={TIP_STYLE} formatter={(v: unknown) => [fmt(v, true), numCol.replace(/_/g, " ")]} />
                      <Bar dataKey="value" fill={`url(#${gradId})`} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  ) : kpi.chart_type === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent.fill} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={accent.fill} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textDim }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: T.textDim }} tickLine={false} axisLine={false} width={70} />
                      <ReferenceLine y={avg} stroke={T.textDim} strokeDasharray="4 4" label={{ value: "avg", position: "right", fontSize: 10, fill: T.textDim }} />
                      <Tooltip contentStyle={TIP_STYLE} formatter={(v: unknown) => [fmt(v, true), numCol.replace(/_/g, " ")]} />
                      <Area type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} fill={`url(#${gradId})`} dot={{ r: 4, fill: accent.stroke, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textDim }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: T.textDim }} tickLine={false} axisLine={false} width={70} />
                      <ReferenceLine y={avg} stroke={T.textDim} strokeDasharray="4 4" label={{ value: "avg", position: "right", fontSize: 10, fill: T.textDim }} />
                      <Tooltip contentStyle={TIP_STYLE} formatter={(v: unknown) => [fmt(v, true), numCol.replace(/_/g, " ")]} />
                      <Line type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} dot={{ r: 4, fill: accent.stroke, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Data breakdown table ────────────────────────────────────────── */}
          {tableRows.length > 0 && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: T.textSec }}>
                  {isTimeSeries ? "Period Breakdown" : "Full Breakdown"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: T.textDim }}>
                  {tableRows.length} {isTimeSeries ? "periods" : "entries"}
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: T.surface2 }}>
                      {!isTimeSeries && (
                        <th style={{ padding: "11px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em", width: "40px" }}>
                          #
                        </th>
                      )}
                      <th style={{ padding: "11px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {lblCol.replace(/_/g, " ")}
                      </th>
                      <th style={{ padding: "11px 20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {numCol.replace(/_/g, " ")}
                      </th>
                      {!isTimeSeries && total > 0 && (
                        <th style={{ padding: "11px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em", minWidth: "160px" }}>
                          Share
                        </th>
                      )}
                      {isTimeSeries && (
                        <th style={{ padding: "11px 20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          vs Prior
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => {
                      const val      = Number(row[numCol] ?? 0)
                      const sharePct = total > 0 ? (val / total) * 100 : 0
                      const priorVal = isTimeSeries && i > 0 ? Number(tableRows[i - 1][numCol] ?? 0) : null
                      const chg      = priorVal !== null ? pctChange(priorVal, val) : null
                      const isTop    = !isTimeSeries && i === 0
                      const isBot    = !isTimeSeries && i === tableRows.length - 1

                      return (
                        <tr key={i} style={{
                          borderTop: `1px solid ${T.border}`,
                          background: isTop ? `${accent.fill}06` : undefined,
                        }}>
                          {!isTimeSeries && (
                            <td style={{ padding: "13px 20px", fontSize: "12px", fontWeight: 700, color: i < 3 ? accent.stroke : T.textDim }}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                            </td>
                          )}
                          <td style={{ padding: "13px 20px", fontSize: "13px", fontWeight: isTop ? 700 : 400, color: isTop ? T.text : T.textSec, whiteSpace: "nowrap" }}>
                            {label(row[lblCol])}
                          </td>
                          <td style={{ padding: "13px 20px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: isTop ? accent.stroke : isBot ? T.textDim : T.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                            {fmt(val, true)}
                          </td>
                          {!isTimeSeries && total > 0 && (
                            <td style={{ padding: "13px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ flex: 1, height: "6px", background: T.surface3, borderRadius: "99px", overflow: "hidden" }}>
                                  <div style={{
                                    height: "100%", borderRadius: "99px",
                                    width: `${sharePct}%`,
                                    background: `linear-gradient(90deg, ${accent.stroke}, ${accent.stroke}88)`,
                                  }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: T.textDim, fontVariantNumeric: "tabular-nums", minWidth: "38px", textAlign: "right" }}>
                                  {sharePct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          )}
                          {isTimeSeries && (
                            <td style={{ padding: "13px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                              {chg === null ? (
                                <span style={{ fontSize: "12px", color: T.textDim }}>—</span>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: "3px",
                                  fontSize: "12px", fontWeight: 700,
                                  color: chg >= 0 ? T.green : T.red,
                                  background: chg >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                  padding: "3px 8px", borderRadius: "6px",
                                }}>
                                  {chg >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {chg >= 0 ? "+" : ""}{chg.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Auto insights ───────────────────────────────────────────────── */}
          {insights.length > 0 && (
            <div style={{ ...card, padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: T.textSec }}>
                Key Insights
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {insights.map((ins, i) => (
                  <Insight key={i} icon={ins.icon} text={ins.text} positive={ins.positive} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
