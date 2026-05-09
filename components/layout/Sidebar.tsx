"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Database, Plug, MessageSquare,
  CreditCard, Settings, LogOut, BarChart2,
} from "lucide-react"
import type { Workspace } from "@/lib/types"
import { T } from "@/lib/theme"

interface Props { workspace: Workspace; subscriptionStatus: string }

function NavLink({ href, label, icon: Icon, exact }: {
  href: string; label: string; icon: React.ElementType; exact?: boolean
}) {
  const path   = usePathname()
  const active = exact ? path === href : path.startsWith(href)
  return (
    <Link href={href} className={`nav-item${active ? " active" : ""}`}>
      <Icon size={15} className="nav-icon" />
      {label}
    </Link>
  )
}

const STATUS_CFG = {
  active:   { dot: T.green,    label: "Pro · Active"   },
  past_due: { dot: T.red,      label: "Payment failed" },
  canceled: { dot: T.textDim,  label: "Canceled"       },
  expired:  { dot: T.textDim,  label: "Inactive"       },
  trialing: { dot: T.textDim,  label: "Unsubscribed"   },
} as const

export function Sidebar({ workspace, subscriptionStatus }: Props) {
  const base = `/w/${workspace.slug}`
  const cfg  = STATUS_CFG[subscriptionStatus as keyof typeof STATUS_CFG] ?? STATUS_CFG.expired

  return (
    <aside style={{
      width: "232px", minWidth: "232px", height: "100%",
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Brand */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${T.border}` }}>
        <Link href={`${base}/dashboard`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(14,165,233,0.35)",
          }}>
            <BarChart2 size={15} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "14.5px", color: T.text, letterSpacing: "-0.3px" }}>
            BizIntel
          </span>
        </Link>
      </div>

      {/* Workspace pill */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "9px",
          padding: "9px 10px", borderRadius: "8px",
          background: T.surface2, border: `1px solid ${T.border}`,
        }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "white",
          }}>
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.name}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "10.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
              <span style={{ color: T.textMuted }}>{cfg.label}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar" style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.09em", padding: "0 10px 7px", margin: 0 }}>
          Analytics
        </p>
        <NavLink href={`${base}/dashboard`}    label="Dashboard"    icon={LayoutDashboard} exact />
        <NavLink href={`${base}/data/upload`}  label="Data sources"  icon={Database} />
        <NavLink href={`${base}/integrations`} label="Integrations"  icon={Plug} />
        <NavLink href={`${base}/chat`}         label="AI Advisor"    icon={MessageSquare} />

        <div style={{ height: "1px", background: T.border, margin: "10px 4px" }} />

        <p style={{ fontSize: "10px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.09em", padding: "0 10px 7px", margin: 0 }}>
          Account
        </p>
        <NavLink href={`${base}/settings/billing`} label="Billing"  icon={CreditCard} />
        <NavLink href={`${base}/settings`}          label="Settings" icon={Settings} />
      </nav>

      {/* Sign out */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px" }}>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="nav-item" style={{ width: "100%" }}>
            <LogOut size={14} className="nav-icon" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
