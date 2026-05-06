"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Database, Plug, MessageSquare,
  CreditCard, Settings, LogOut, TrendingUp,
  ChevronDown,
} from "lucide-react"
import type { Workspace } from "@/lib/types"

interface Props {
  workspace: Workspace
  daysLeft: number
  subscriptionStatus: string
}

function NavItem({
  href, icon, label, base,
}: {
  href: string; icon: React.ReactNode; label: string; base: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== base + "/dashboard" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? "bg-white/10 text-white font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
      }`}
    >
      <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}

export function Sidebar({ workspace, daysLeft, subscriptionStatus }: Props) {
  const base = `/w/${workspace.slug}`
  const isActive = subscriptionStatus === "active"
  const isTrialing = subscriptionStatus === "trialing"

  return (
    <aside className="w-56 bg-[#0c0f1a] flex flex-col flex-shrink-0 border-r border-white/[0.06]">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link href={`${base}/dashboard`} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">BizIntel</span>
        </Link>
      </div>

      {/* Workspace selector */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-200 truncate">{workspace.name}</span>
          </div>
          <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
        </button>
        <div className="mt-1.5 px-2">
          {isTrialing && daysLeft > 0 && (
            <span className="text-[10px] font-semibold text-amber-400">
              {daysLeft}d trial left
            </span>
          )}
          {isActive && (
            <span className="text-[10px] font-semibold text-emerald-400">Pro · Active</span>
          )}
          {!isTrialing && !isActive && (
            <span className="text-[10px] font-semibold text-red-400">Trial ended</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
          Overview
        </p>
        <NavItem href={`${base}/dashboard`}    icon={<LayoutDashboard size={15} />} label="Dashboard"    base={base} />
        <NavItem href={`${base}/data/upload`}  icon={<Database size={15} />}       label="Data sources"  base={base} />
        <NavItem href={`${base}/integrations`} icon={<Plug size={15} />}           label="Integrations"  base={base} />
        <NavItem href={`${base}/chat`}         icon={<MessageSquare size={15} />}  label="AI Advisor"    base={base} />

        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mt-4 mb-2">
          Account
        </p>
        <NavItem href={`${base}/settings/billing`} icon={<CreditCard size={15} />} label="Billing"  base={base} />
        <NavItem href={`${base}/settings`}         icon={<Settings size={15} />}   label="Settings" base={base} />
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        <form action="/api/auth/signout" method="post">
          <button className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-slate-300 w-full px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
