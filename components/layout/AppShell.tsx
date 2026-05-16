"use client"

import { useState } from "react"
import { Menu, BarChart2 } from "lucide-react"
import { Sidebar } from "./Sidebar"
import type { Workspace } from "@/lib/types"

interface Props {
  workspace: Workspace
  subscriptionStatus: string
  children: React.ReactNode
}

export function AppShell({ workspace, subscriptionStatus, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#060d1a" }}>
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? " open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar — becomes fixed overlay drawer on mobile */}
      <div className={`app-sidebar-wrapper${mobileOpen ? " mobile-open" : ""}`}>
        <Sidebar workspace={workspace} subscriptionStatus={subscriptionStatus} />
      </div>

      {/* Right side: mobile header + page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Mobile-only top bar */}
        <div className="mobile-header">
          <button
            className="mobile-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "24px", height: "24px", borderRadius: "6px", flexShrink: 0,
              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BarChart2 size={12} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", color: "#e2e8f0", letterSpacing: "-0.3px" }}>
              BizIntel
            </span>
          </div>
        </div>

        {/* Page content */}
        <main style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: "hidden", minWidth: 0, overflowY: "auto",
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
