"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Database, Plug, MessageSquare,
  CreditCard, Settings, LogOut, TrendingUp, ChevronDown,
} from "lucide-react"
import type { Workspace } from "@/lib/types"

interface Props {
  workspace: Workspace
  daysLeft: number
  subscriptionStatus: string
}

const SIDEBAR_BG    = "#0b0d14"
const ACTIVE_BG     = "rgba(255,255,255,0.09)"
const HOVER_BG      = "rgba(255,255,255,0.05)"
const BORDER_COLOR  = "rgba(255,255,255,0.07)"
const TEXT_DEFAULT  = "#64748b"
const TEXT_ACTIVE   = "#f8fafc"
const TEXT_HOVER    = "#cbd5e1"

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname  = usePathname()
  const isActive  = pathname === href ||
    (pathname.startsWith(href) && href !== "/" && !href.endsWith("/dashboard") || href === pathname)
  const exactActive = pathname === href

  // Special case: dashboard is only active when exactly on dashboard
  const active = href.endsWith("/dashboard") ? exactActive : pathname.startsWith(href)

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "7px 10px",
        borderRadius: "9px",
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        color: active ? TEXT_ACTIVE : TEXT_DEFAULT,
        background: active ? ACTIVE_BG : "transparent",
        transition: "all 0.15s ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = HOVER_BG;
          (e.currentTarget as HTMLElement).style.color = TEXT_HOVER;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT;
        }
      }}
    >
      <span style={{ opacity: active ? 1 : 0.55, display: "flex" }}>{icon}</span>
      {label}
    </Link>
  )
}

export function Sidebar({ workspace, daysLeft, subscriptionStatus }: Props) {
  const base = `/w/${workspace.slug}`
  const isActive  = subscriptionStatus === "active"
  const isTrialing = subscriptionStatus === "trialing"

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        backgroundColor: SIDEBAR_BG,
        borderRight: `1px solid ${BORDER_COLOR}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <Link href={`${base}/dashboard`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <TrendingUp size={14} color="white" />
          </div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "14px", letterSpacing: "-0.3px" }}>
            BizIntel
          </span>
        </Link>
      </div>

      {/* Workspace */}
      <div style={{ padding: "10px 10px 6px", borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 8px", borderRadius: "8px", cursor: "pointer",
          background: HOVER_BG,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <div style={{
              width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            }} />
            <span style={{ color: "#cbd5e1", fontSize: "12.5px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.name}
            </span>
          </div>
          <ChevronDown size={12} color="#475569" style={{ flexShrink: 0 }} />
        </div>
        <div style={{ padding: "4px 8px" }}>
          {isTrialing && daysLeft > 0 && (
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#f59e0b" }}>
              {daysLeft}d left in trial
            </span>
          )}
          {isActive && (
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#34d399" }}>Pro · Active</span>
          )}
          {!isTrialing && !isActive && (
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#f87171" }}>Trial ended</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="no-scrollbar" style={{ flex: 1, padding: "10px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 10px 4px" }}>
          Overview
        </p>
        <NavItem href={`${base}/dashboard`}    icon={<LayoutDashboard size={15} />} label="Dashboard" />
        <NavItem href={`${base}/data/upload`}  icon={<Database size={15} />}       label="Data sources" />
        <NavItem href={`${base}/integrations`} icon={<Plug size={15} />}           label="Integrations" />
        <NavItem href={`${base}/chat`}         icon={<MessageSquare size={15} />}  label="AI Advisor" />

        <div style={{ height: "1px", background: BORDER_COLOR, margin: "8px 4px" }} />

        <p style={{ fontSize: "10px", fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px" }}>
          Account
        </p>
        <NavItem href={`${base}/settings/billing`} icon={<CreditCard size={15} />} label="Billing" />
        <NavItem href={`${base}/settings`}          icon={<Settings size={15} />}   label="Settings" />
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER_COLOR}`, padding: "10px 8px" }}>
        <form action="/api/auth/signout" method="post">
          <button
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 10px", borderRadius: "8px", width: "100%",
              background: "none", border: "none", cursor: "pointer",
              color: TEXT_DEFAULT, fontSize: "13px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = HOVER_BG;
              (e.currentTarget as HTMLElement).style.color = TEXT_HOVER;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT;
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
