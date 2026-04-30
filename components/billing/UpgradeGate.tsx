"use client"

import { usePathname } from "next/navigation"
import { UpgradeWall } from "./UpgradeWall"

interface Props {
  children: React.ReactNode
  workspace: { id: string; name: string }
}

export function UpgradeGate({ children, workspace }: Props) {
  const pathname = usePathname()
  // Always allow access to the billing settings page
  if (pathname.includes("/settings/billing")) return <>{children}</>
  return <UpgradeWall workspace={workspace} />
}
