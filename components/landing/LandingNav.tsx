"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart2, Menu, X } from "lucide-react"

const NAVY   = "#0f172a"
const TEAL   = "#0ea5e9"
const GRAY   = "#64748b"
const BORDER = "#e2e8f0"

const NAV_LINKS = ["Features", "Integrations", "Pricing"] as const

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BORDER}`,
    }}>
      {/* Main row */}
      <div
        className="landing-nav-inner"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 48px", height: "64px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", background: TEAL, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.3px", color: NAVY }}>BizIntel</span>
        </div>

        {/* Desktop center links */}
        <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: "14px", fontWeight: 500, color: GRAY, textDecoration: "none" }}>{l}</a>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="landing-nav-auth" style={{ display: "flex", gap: "10px" }}>
          <Link href="/login" style={{
            padding: "8px 18px", borderRadius: "7px", fontSize: "14px", fontWeight: 600,
            border: `1.5px solid ${BORDER}`, color: NAVY, textDecoration: "none", background: "white",
          }}>
            Log in
          </Link>
          <Link href="/signup" style={{
            padding: "8px 18px", borderRadius: "7px", fontSize: "14px", fontWeight: 600,
            background: NAVY, color: "white", textDecoration: "none",
          }}>
            Get started →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="landing-hamburger"
          onClick={() => setOpen(o => !o)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px", borderRadius: "8px", color: NAVY,
            alignItems: "center", justifyContent: "center",
            minWidth: "44px", minHeight: "44px",
          }}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div style={{
          background: "rgba(255,255,255,0.98)",
          borderTop: `1px solid ${BORDER}`,
          padding: "16px 24px 24px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}>
            {NAV_LINKS.map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                onClick={() => setOpen(false)}
                style={{
                  fontSize: "16px", fontWeight: 500, color: NAVY,
                  textDecoration: "none", padding: "14px 0",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                display: "block", textAlign: "center",
                padding: "13px", borderRadius: "9px", fontSize: "15px", fontWeight: 600,
                border: `1.5px solid ${BORDER}`, color: NAVY, textDecoration: "none",
              }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              style={{
                display: "block", textAlign: "center",
                padding: "13px", borderRadius: "9px", fontSize: "15px", fontWeight: 700,
                background: NAVY, color: "white", textDecoration: "none",
              }}
            >
              Get started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
