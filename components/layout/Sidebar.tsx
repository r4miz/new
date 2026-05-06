"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Database, Plug, MessageSquare,
  CreditCard, Settings, LogOut, BarChart2,
} from "lucide-react"
import type { Workspace } from "@/lib/types"

interface Props {
  workspace: Workspace
  daysLeft: number
  subscriptionStatus: string
}

const C = {
  bg:       "#0f172a",
  border:   "rgba(255,255,255,0.07)",
  text:     "#64748b",
  textHov:  "#cbd5e1",
  textOn:   "#f1f5f9",
  bgOn:     "rgba(14,165,233,0.12)",
  bgHov:    "rgba(255,255,255,0.04)",
  accent:   "#0ea5e9",
  section:  "#1e293b",
}

function NavItem({ href, label, icon, exact }: {
  href: string; label: string; icon: React.ReactNode; exact?: boolean
}) {
  const path   = usePathname()
  const active = exact ? path === href : path.startsWith(href)

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 12px", borderRadius: "8px", marginBottom: "2px",
          fontSize: "13.5px", fontWeight: active ? 600 : 400,
          color: active ? C.textOn : C.text,
          background: active ? C.bgOn : "transparent",
          borderLeft: `2px solid ${active ? C.accent : "transparent"}`,
          transition: "all 0.12s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = C.bgHov
            ;(e.currentTarget as HTMLElement).style.color = C.textHov
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent"
            ;(e.currentTarget as HTMLElement).style.color = C.text
          }
        }}
      >
        <span style={{ flexShrink: 0, opacity: active ? 1 : 0.55, display: "flex", color: active ? C.accent : "inherit" }}>
          {icon}
        </span>
        {label}
      </div>
    </Link>
  )
}

export function Sidebar({ workspace, daysLeft, subscriptionStatus }: Props) {
  const base      = `/w/${workspace.slug}`
  const isActive  = subscriptionStatus === "active"
  const trialing  = subscriptionStatus === "trialing" && daysLeft > 0
  const urgent    = trialing && daysLeft <= 3

  return (
    <aside style={{
      width: "220px", minWidth: "220px", height: "100%",
      backgroundColor: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Brand */}
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
        <Link href={`${base}/dashboard`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px", height: "32px",
            background: C.accent,
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <BarChart2 size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "15px", color: "#f1f5f9", letterSpacing: "-0.3px" }}>
            BizIntel
          </span>
        </Link>
      </div>

      {/* Workspace pill */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "10px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "white" }}>
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.name}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "10.5px", fontWeight: 600, color: isActive ? "#34d399" : urgent ? "#f87171" : trialing ? "#fbbf24" : "#f87171" }}>
              {isActive ? "● Pro · Active" : trialing ? `● ${daysLeft}d trial left` : "● Trial ended"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar" style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 12px 8px", margin: 0 }}>
          Analytics
        </p>
        <NavItem href={`${base}/dashboard`}    label="Dashboard"    icon={<LayoutDashboard size={15} />} exact />
        <NavItem href={`${base}/data/upload`}  label="Data sources"  icon={<Database size={15} />} />
        <NavItem href={`${base}/integrations`} label="Integrations"  icon={<Plug size={15} />} />
        <NavItem href={`${base}/chat`}         label="AI Advisor"    icon={<MessageSquare size={15} />} />

        <div style={{ height: "1px", background: C.border, margin: "12px 4px" }} />

        <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 12px 8px", margin: 0 }}>
          Account
        </p>
        <NavItem href={`${base}/settings/billing`} label="Billing"  icon={<CreditCard size={15} />} />
        <NavItem href={`${base}/settings`}          label="Settings" icon={<Settings size={15} />} />
      </nav>

      {/* Sign out */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px" }}>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px", borderRadius: "8px",
              background: "none", border: "none", cursor: "pointer",
              color: C.text, fontSize: "13.5px", fontWeight: 400,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.bgHov
              ;(e.currentTarget as HTMLElement).style.color = C.textHov
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "none"
              ;(e.currentTarget as HTMLElement).style.color = C.text
            }}
          >
            <LogOut size={14} style={{ opacity: 0.5 }} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
