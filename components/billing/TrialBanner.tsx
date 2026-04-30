"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

interface Props {
  daysLeft: number
  workspaceSlug: string
}

export function TrialBanner({ daysLeft, workspaceSlug }: Props) {
  const urgent = daysLeft <= 3

  return (
    <div className={`flex items-center justify-between gap-4 px-6 py-2.5 text-sm flex-shrink-0 ${
      urgent
        ? "bg-red-500 text-white"
        : "bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 text-amber-900"
    }`}>
      <div className="flex items-center gap-2">
        <Zap size={14} className={urgent ? "text-yellow-300" : "text-amber-500"} fill="currentColor" />
        <span>
          <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> left in your free trial
          {urgent ? " — your dashboard will pause when it ends." : "."}
        </span>
      </div>
      <Link
        href={`/w/${workspaceSlug}/settings/billing`}
        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
          urgent
            ? "bg-white text-red-600 hover:bg-red-50"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        Upgrade now →
      </Link>
    </div>
  )
}
