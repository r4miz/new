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

const S = {
  bg:       "#0f172a",
  border:   "rgba(255,255,255,0.06)",
  text:     "#64748b",
  textHov:  "#e2e8f0",
  textOn:   "#f8fafc",
  itemOn:   "rgba(255,255,255,0.08)",
  itemHov:  "rgba(255,255,255,0.04)",
  accent:   "#0ea5e9",
  section:  "#334155",
} as const

function NavItem({ href, icon, label, exact }: { href: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  const path   = usePathname()
  const active = exact ? path === href : path === href || path.startsWith(href + "/") || path.startsWith(href.replace(/\/[^/]+$/, "") + "/" + label.toLowerCase())

  // Simpler and more reliable active check
  const isActive = exact ? path === href : path.startsWith(href)

  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "7px 12px", borderRadius: "6px",
        fontSize: "13.5px", fontWeight: isActive ? 500 : 400,
        color: isActive ? S.textOn : S.text,
        background: isActive ? S.itemOn : "transparent",
        borderLeft: isActive ? `2px solid ${S.accent}` : "2px solid transparent",
        transition: "all 0.12s",
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.background = S.itemHov
          el.style.color = S.textHov
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.background = "transparent"
          el.style.color = S.text
        }
      }}
    >
      <span style={{ opacity: isActive ? 1 : 0.5, display: "flex", flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: "10.5px", fontWeight: 600, color: S.section,
      textTransform: "uppercase", letterSpacing: "0.07em",
      padding: "14px 12px 6px", margin: 0,
    }}>
      {label}
    </p>
  )
}

export function Sidebar({ workspace, daysLeft, subscriptionStatus }: Props) {
  const base = `/w/${workspace.slug}`
  const active  = subscriptionStatus === "active"
  const trialing = subscriptionStatus === "trialing" && daysLeft > 0

  const statusLabel = active ? "Pro" : trialing ? `${daysLeft}d trial` : "Expired"
  const statusColor = active ? "#34d399" : trialing && daysLeft <= 3 ? "#f87171" : trialing ? "#fbbf24" : "#f87171"

  return (
    <aside style={{
      width: "216px", minWidth: "216px",
      backgroundColor: S.bg,
      borderRight: `1px solid ${S.border}`,
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${S.border}` }}>
        <Link href={`${base}/dashboard`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "30px", height: "30px",
            background: S.accent,
            borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <BarChart2 size={15} color="white" />
          </div>
          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "14px", letterSpacing: "-0.3px" }}>
            BizIntel
          </span>
        </Link>
      </div>

      {/* Workspace */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ fontSize: "11px", color: S.text, marginBottom: "4px", fontWeight: 500 }}>
          WORKSPACE
        </div>
        <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {workspace.name}
        </div>
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: statusColor }}>
            ● {statusLabel}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar" style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
        <SectionLabel label="Main" />
        <NavItem href={`${base}/dashboard`}    icon={<LayoutDashboard size={15} />} label="Dashboard"   exact />
        <NavItem href={`${base}/data/upload`}  icon={<Database size={15} />}       label="Data"         />
        <NavItem href={`${base}/integrations`} icon={<Plug size={15} />}           label="Integrations" />
        <NavItem href={`${base}/chat`}         icon={<MessageSquare size={15} />}  label="AI Advisor"   />

        <SectionLabel label="Account" />
        <NavItem href={`${base}/settings/billing`} icon={<CreditCard size={15} />} label="Billing"  />
        <NavItem href={`${base}/settings`}          icon={<Settings size={15} />}   label="Settings" />
      </nav>

      {/* Sign out */}
      <div style={{ borderTop: `1px solid ${S.border}`, padding: "10px 8px" }}>
        <form action="/api/auth/signout" method="post">
          <button style={{
            display: "flex", alignItems: "center", gap: "9px",
            padding: "7px 12px", borderRadius: "6px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            color: S.text, fontSize: "13.5px", fontWeight: 400,
            transition: "all 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.textHov; (e.currentTarget as HTMLElement).style.background = S.itemHov }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.text; (e.currentTarget as HTMLElement).style.background = "none" }}
          >
            <LogOut size={14} style={{ opacity: 0.5 }} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
