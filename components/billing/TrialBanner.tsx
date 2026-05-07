"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

interface Props { daysLeft: number; workspaceSlug: string }

export function TrialBanner({ daysLeft, workspaceSlug }: Props) {
  const urgent = daysLeft <= 3
  const bg     = urgent ? "rgba(239,68,68,0.12)"  : "rgba(245,158,11,0.08)"
  const border = urgent ? "rgba(239,68,68,0.25)"  : "rgba(245,158,11,0.2)"
  const color  = urgent ? "#fca5a5"                : "#fcd34d"
  const btnBg  = urgent ? "rgba(239,68,68,0.2)"   : "rgba(245,158,11,0.15)"
  const btnCol = urgent ? "#fca5a5"                : "#fcd34d"

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      padding: "10px 24px", flexShrink: 0,
      background: bg, borderBottom: `1px solid ${border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Zap size={13} color={color} fill={color} />
        <span style={{ fontSize: "13px", color }}>
          <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> left in your free trial
          {urgent ? " — upgrade now to keep access." : "."}
        </span>
      </div>
      <Link href={`/w/${workspaceSlug}/settings/billing`} style={{
        flexShrink: 0, fontSize: "12px", fontWeight: 700,
        padding: "5px 14px", borderRadius: "6px",
        background: btnBg, color: btnCol,
        textDecoration: "none", whiteSpace: "nowrap",
        border: `1px solid ${border}`,
      }}>
        Upgrade →
      </Link>
    </div>
  )
}
