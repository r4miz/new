"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

interface Props { daysLeft: number; workspaceSlug: string }

export function TrialBanner({ daysLeft, workspaceSlug }: Props) {
  const urgent = daysLeft <= 3

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
      padding: "8px 20px", flexShrink: 0,
      background: urgent ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.06)",
      borderBottom: `1px solid ${urgent ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)"}`,
    }}>
      <Zap size={12} color={urgent ? "#f87171" : "#fbbf24"} fill={urgent ? "#f87171" : "#fbbf24"} />
      <span style={{ fontSize: "13.5px", color: urgent ? "#fca5a5" : "#fcd34d" }}>
        <strong>{daysLeft}d</strong> left in your trial
      </span>
      <Link href={`/w/${workspaceSlug}/settings/billing`} style={{
        fontSize: "13px", fontWeight: 700,
        padding: "3px 10px", borderRadius: "5px",
        background: urgent ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.15)",
        color: urgent ? "#fca5a5" : "#fcd34d",
        textDecoration: "none",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)"}`,
      }}>
        Upgrade
      </Link>
    </div>
  )
}
