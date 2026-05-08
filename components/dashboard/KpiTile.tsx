"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { KpiProposal } from "@/lib/types"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, BarChart2, Activity, Hash } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Tooltip } from "recharts"
import { T } from "@/lib/theme"

interface Props { kpi: KpiProposal; workspaceSlug: string }
type Row = Record<string, unknown>

const CHART_COLOR: Record<string, string> = {
  line: T.accent, area: T.purple, bar: T.amber, number: T.green,
}
const CHART_ICON: Record<string, React.ElementType> = {
  line: Activity, area: Activity, bar: BarChart2, number: Hash,
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
}

function shortLabel(v: unknown): string {
  const s = String(v ?? "")
  const m = s.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (m) return new Date(`${m[1]}-${m[2]}-01`).toLocaleString("default", { month: "short" })
  return s.length > 9 ? s.slice(0, 8) + "…" : s
}

function pctChange(rows: Row[], col: string): number | null {
  if (rows.length < 2) return null
  const v = rows.map(r => Number(r[col] ?? 0))
  const p = v[v.length - 2], c = v[v.length - 1]
  return p === 0 ? null : ((c - p) / Math.abs(p)) * 100
}

const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: string }) =>
  active && payload?.length ? (
    <div style={{
      background: T.surface3, border: `1px solid ${T.borderMd}`,
      borderRadius: "7px", padding: "7px 11px",
      boxShadow: T.shadow2,
    }}>
      <p style={{ color: T.textMuted, fontSize: "10px", margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: T.text, fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: "var(--font-mono, monospace)" }}>
        {fmt(payload[0]?.value)}
      </p>
    </div>
  ) : null

export function KpiTile({ kpi, workspaceSlug }: Props) {
  const [rows,    setRows]    = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)

  const color   = CHART_COLOR[kpi.chart_type] ?? T.accent
  const Icon    = CHART_ICON[kpi.chart_type] ?? Activity
  const gradId  = `g-${kpi.id}`

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

  const cols     = rows?.length ? Object.keys(rows[0]) : []
  const numCol   = cols.find(c => typeof rows![0][c] === "number") ?? cols[cols.length - 1]
  const lblCol   = cols.find(c => c !== numCol) ?? cols[0]
  const scalar   = kpi.chart_type === "number" || !rows || rows.length <= 1
  const pct      = rows && !scalar ? pctChange(rows, numCol) : null
  const headline = rows?.length ? rows[scalar ? 0 : rows.length - 1][numCol] : null
  const data     = rows?.map(r => ({ l: shortLabel(r[lblCol]), v: Number(r[numCol] ?? 0) }))
  const hasChart = !loading && !error && data && data.length > 1 && kpi.chart_type !== "number"

  return (
    <Link
      href={`/w/${workspaceSlug}/kpis/${kpi.id}`}
      style={{
        display: "block", textDecoration: "none",
        borderRadius: T.r5,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderMd}` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.borderMd : T.border}`,
        borderRadius: T.r5,
        overflow: "hidden",
        transition: "border-color 0.18s",
      }}>

        {/* Top accent line */}
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />

        {/* Header row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <div style={{
              width: "22px", height: "22px", borderRadius: "5px", flexShrink: 0,
              background: `${color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={12} color={color} />
            </div>
            <p style={{
              margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase", color: T.textMuted,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {kpi.name}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            {pct !== null && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "2px",
                fontSize: "11px", fontWeight: 700,
                color: pct >= 0 ? T.green : T.red,
                background: pct >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                padding: "2px 7px", borderRadius: "99px",
              }}>
                {pct >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {Math.abs(pct).toFixed(1)}%
              </span>
            )}
            <button
              onClick={e => { e.preventDefault(); load() }}
              aria-label="Refresh"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: T.textDim, padding: "3px", display: "flex",
                borderRadius: "4px",
              }}
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Number */}
        <div style={{ padding: loading || error ? "12px 16px 14px" : "10px 16px 12px" }}>
          {loading ? (
            <>
              <div className="shimmer" style={{ height: "36px", width: "120px", borderRadius: "5px", marginBottom: "6px" }} />
              <div className="shimmer" style={{ height: "10px", width: "70px", borderRadius: "3px" }} />
            </>
          ) : error ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "8px 10px", background: "rgba(239,68,68,0.08)",
              borderRadius: "6px", border: "1px solid rgba(239,68,68,0.18)",
            }}>
              <AlertCircle size={13} color={T.red} />
              <span style={{ fontSize: "12px", color: T.red }}>Query failed</span>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: "36px", fontWeight: 800, color: T.text,
                letterSpacing: "-1.5px", lineHeight: 1,
                fontFamily: "var(--font-mono, 'Fira Code', monospace)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmt(headline)}
              </div>
              <div style={{ fontSize: "11px", color: T.textDim, marginTop: "4px" }}>
                {(numCol ?? "").replace(/_/g, " ")}
              </div>
            </>
          )}
        </div>

        {/* Sparkline */}
        {hasChart && (
          <div style={{ height: "72px", marginTop: "-4px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {kpi.chart_type === "bar" ? (
                <BarChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }} barCategoryGap="35%">
                  <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} opacity={0.75} />
                  <Tooltip content={<ChartTip />} cursor={false} />
                </BarChart>
              ) : (
                <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: T.borderMd, strokeWidth: 1 }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "8px 16px 10px",
          borderTop: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "11px", color: T.textDim }}>
            {!loading && !error && rows && rows.length > 1 ? `${rows.length} points` : ""}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: color, display: "flex", alignItems: "center", gap: "3px" }}>
            Explore <TrendingUp size={10} />
          </span>
        </div>
      </div>
    </Link>
  )
}
