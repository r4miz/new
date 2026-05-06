import Link from "next/link"
import {
  BarChart2, Brain, Plug, ArrowRight, Check,
  TrendingUp, MessageSquare, Zap, ShoppingBag,
  Database, CreditCard,
} from "lucide-react"

// ── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = "#0f172a"
const TEAL   = "#0ea5e9"
const TEALL  = "#e0f2fe"
const GRAY   = "#64748b"
const BORDER = "#e2e8f0"

const FEATURES = [
  {
    icon: BarChart2, color: TEAL,
    title: "AI-Generated KPI Dashboard",
    desc: "Upload a CSV or connect an integration. Our AI reads your data, understands your industry, and builds a live KPI dashboard — complete with charts, trends, and drill-in tables — in under 60 seconds.",
  },
  {
    icon: Brain, color: "#8b5cf6",
    title: "Industry Expert AI Advisor",
    desc: "Ask anything about your business in plain English. The AI advisor combines your real data with deep industry knowledge — benchmarks, growth strategies, pricing models — and gives you answers a consultant would charge thousands for.",
  },
  {
    icon: Plug, color: "#10b981",
    title: "Live Data Integrations",
    desc: "Connect Shopify, HubSpot, Stripe, Google Sheets, WooCommerce, and Airtable. Your dashboard syncs automatically every day so your KPIs always reflect where your business actually stands.",
  },
]

const STEPS = [
  { n: "01", title: "Connect your data",      desc: "Upload a CSV or connect an integration. Takes less than 2 minutes." },
  { n: "02", title: "AI builds your dashboard", desc: "Instant KPIs, charts, and trends. No setup, no SQL, no analyst needed." },
  { n: "03", title: "Ask. Explore. Decide.",   desc: "Chat with your AI advisor, drill into any metric, and take action with confidence." },
]

const INTEGRATIONS = [
  { name: "Shopify",       color: "#96bf48" },
  { name: "HubSpot",       color: "#ff7a59" },
  { name: "Stripe",        color: "#635bff" },
  { name: "Google Sheets", color: "#0f9d58" },
  { name: "WooCommerce",   color: "#7f54b3" },
  { name: "Airtable",      color: "#fcb400" },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", color: NAVY, overflowX: "hidden" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", background: TEAL, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.3px" }}>BizIntel</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Features", "Integrations", "Pricing"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: "14px", fontWeight: 500, color: GRAY, textDecoration: "none" }}>{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/login" style={{
            padding: "8px 18px", borderRadius: "7px", fontSize: "14px", fontWeight: 600,
            border: `1.5px solid ${BORDER}`, color: NAVY, textDecoration: "none", background: "white",
          }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            padding: "8px 18px", borderRadius: "7px", fontSize: "14px", fontWeight: 600,
            background: NAVY, color: "white", textDecoration: "none",
          }}>
            Start free trial →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(160deg, ${NAVY} 0%, #1e293b 60%, #0f2744 100%)`,
        minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px", pointerEvents: "none",
        }} />
        {/* Glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: `radial-gradient(ellipse, ${TEAL}22 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "760px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
            color: "#7dd3fc", fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.04em",
            padding: "6px 14px", borderRadius: "99px", marginBottom: "28px",
          }}>
            <Zap size={12} fill="currentColor" />
            AI Business Intelligence Platform
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 900, color: "#f8fafc",
            lineHeight: 1.1, letterSpacing: "-2px", margin: "0 0 24px",
          }}>
            Every business deserves<br />
            <span style={{ color: TEAL }}>a data analyst.</span>
          </h1>

          <p style={{ fontSize: "18px", color: "#94a3b8", lineHeight: 1.7, margin: "0 auto 40px", maxWidth: "560px" }}>
            Connect your data, get an AI-generated KPI dashboard in under 60 seconds,
            and ask your industry-expert AI advisor anything — no SQL, no consultants, no guesswork.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: TEAL, color: "white", fontWeight: 700, fontSize: "15px",
              padding: "14px 28px", borderRadius: "9px", textDecoration: "none",
              boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
            }}>
              Start free — 14 days
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.07)", color: "#e2e8f0", fontWeight: 600, fontSize: "15px",
              padding: "14px 28px", borderRadius: "9px", textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              Sign in
            </Link>
          </div>

          <p style={{ fontSize: "13px", color: "#475569", marginTop: "20px" }}>
            No credit card required · Cancel anytime · Full access during trial
          </p>

          {/* Mock dashboard preview */}
          <div style={{
            marginTop: "64px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
              {[
                { label: "TOTAL REVENUE",        value: "$284.5K", trend: "+12.4%", color: TEAL     },
                { label: "NET PROFIT",            value: "$91.2K",  trend: "+8.1%",  color: "#10b981" },
                { label: "MONTHLY GROWTH",        value: "18.3%",   trend: "+3.2%",  color: "#8b5cf6" },
              ].map(card => (
                <div key={card.label} style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: "10px",
                  padding: "16px 18px", textAlign: "left",
                  borderLeft: `3px solid ${card.color}`,
                }}>
                  <p style={{ margin: "0 0 10px", fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>
                    {card.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-1px" }}>
                    {card.value}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 600, color: "#4ade80" }}>
                    ↑ {card.trend}
                  </p>
                </div>
              ))}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: "12px", color: "#64748b" }}>AI Advisor:</span>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                  &ldquo;Your Q2 revenue is up 12.4% — outpacing the industry average of 7.2%. Focus on retaining your top 3 clients who drive 68% of revenue.&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ───────────────────────────────────────────────── */}
      <section style={{ background: "#f8fafc", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "20px 48px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500, margin: 0 }}>Works with your existing tools</p>
          {INTEGRATIONS.map(i => (
            <div key={i.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: i.color }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{i.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: "white", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
              Everything you need
            </p>
            <h2 style={{ fontSize: "40px", fontWeight: 900, color: NAVY, margin: "0 0 16px", letterSpacing: "-1px" }}>
              The analytics stack your business deserves
            </h2>
            <p style={{ fontSize: "17px", color: GRAY, maxWidth: "520px", margin: "0 auto", lineHeight: 1.65 }}>
              Built for founders and operators who want real insights fast, without hiring a data team.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{
                border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                transition: "transform 0.18s, box-shadow 0.18s",
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "10px", background: color + "15",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px",
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: NAVY, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "14.5px", color: GRAY, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section style={{ background: "#f8fafc", padding: "100px 48px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Dead simple
          </p>
          <h2 style={{ fontSize: "40px", fontWeight: 900, color: NAVY, margin: "0 0 64px", letterSpacing: "-1px" }}>
            Up and running in 3 steps
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{
                background: "white", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px 28px",
                textAlign: "left",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  fontSize: "11px", fontWeight: 800, color: TEAL, letterSpacing: "0.08em",
                  background: TEALL, display: "inline-block", padding: "4px 10px", borderRadius: "6px", marginBottom: "20px",
                }}>
                  {n}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: NAVY, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "14px", color: GRAY, lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────────────────────── */}
      <section id="integrations" style={{ background: "white", padding: "100px 48px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Plug &amp; play
          </p>
          <h2 style={{ fontSize: "40px", fontWeight: 900, color: NAVY, margin: "0 0 16px", letterSpacing: "-1px" }}>
            Connects to the tools you already use
          </h2>
          <p style={{ fontSize: "16px", color: GRAY, margin: "0 0 56px", lineHeight: 1.65 }}>
            No engineers needed. Connect in seconds, sync automatically every day.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            {[
              { name: "Shopify",       icon: ShoppingBag, color: "#96bf48", desc: "Orders & revenue"      },
              { name: "HubSpot",       icon: TrendingUp,  color: "#ff7a59", desc: "Deals & pipeline"      },
              { name: "Stripe",        icon: CreditCard,  color: "#635bff", desc: "Payments & volume"     },
              { name: "Google Sheets", icon: Database,    color: "#0f9d58", desc: "Any spreadsheet"       },
              { name: "WooCommerce",   icon: ShoppingBag, color: "#7f54b3", desc: "Store orders"          },
              { name: "Airtable",      icon: Database,    color: "#fcb400", desc: "Any base & table"      },
            ].map(({ name, icon: Icon, color, desc }) => (
              <div key={name} style={{
                background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "24px 20px",
                textAlign: "center",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px", background: color + "20",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                }}>
                  <Icon size={20} color={color} />
                </div>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: NAVY }}>{name}</p>
                <p style={{ margin: 0, fontSize: "12px", color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: "#f8fafc", padding: "100px 48px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Simple pricing
          </p>
          <h2 style={{ fontSize: "40px", fontWeight: 900, color: NAVY, margin: "0 0 16px", letterSpacing: "-1px" }}>
            Start free. Scale when you&apos;re ready.
          </h2>
          <p style={{ fontSize: "16px", color: GRAY, margin: "0 0 56px" }}>
            14-day free trial includes everything. No credit card required.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", textAlign: "left" }}>
            {[
              {
                name: "Starter", price: "$15", period: "/mo",
                features: ["1 workspace", "5 datasets", "AI-generated KPIs", "AI advisor chat", "Email support"],
                cta: "Start free trial", highlight: false,
              },
              {
                name: "Pro", price: "$35", period: "/mo",
                features: ["5 workspaces", "Unlimited datasets", "Unlimited KPIs", "AI advisor chat", "Priority support"],
                cta: "Start free trial", highlight: true,
              },
            ].map(plan => (
              <div key={plan.name} style={{
                background: plan.highlight ? NAVY : "white",
                border: `1px solid ${plan.highlight ? "transparent" : BORDER}`,
                borderRadius: "14px", padding: "32px",
                boxShadow: plan.highlight ? "0 8px 32px rgba(15,23,42,0.2)" : "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: plan.highlight ? "#7dd3fc" : TEAL }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", margin: "0 0 24px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 900, color: plan.highlight ? "#f8fafc" : NAVY, letterSpacing: "-1px" }}>{plan.price}</span>
                  <span style={{ fontSize: "14px", color: plan.highlight ? "#64748b" : GRAY }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: plan.highlight ? "#cbd5e1" : GRAY }}>
                      <Check size={14} color={plan.highlight ? "#4ade80" : TEAL} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display: "block", textAlign: "center", padding: "12px",
                  borderRadius: "8px", fontWeight: 700, fontSize: "14px",
                  background: plan.highlight ? TEAL : NAVY,
                  color: "white", textDecoration: "none",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "24px" }}>
            Annual billing available — save 2 months. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        background: NAVY, padding: "100px 48px", textAlign: "center",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "42px", fontWeight: 900, color: "#f8fafc", margin: "0 0 16px", letterSpacing: "-1px" }}>
            Start knowing your numbers.
          </h2>
          <p style={{ fontSize: "17px", color: "#64748b", margin: "0 0 40px", lineHeight: 1.65 }}>
            Join businesses that replaced expensive data analysts and confusing spreadsheets with BizIntel.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: TEAL, color: "white", fontWeight: 700, fontSize: "16px",
            padding: "16px 36px", borderRadius: "9px", textDecoration: "none",
            boxShadow: "0 8px 28px rgba(14,165,233,0.35)",
          }}>
            Start your free trial
            <ArrowRight size={17} />
          </Link>
          <p style={{ fontSize: "13px", color: "#334155", marginTop: "16px" }}>
            14 days free · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#020617", borderTop: "1px solid #0f172a", padding: "40px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", background: TEAL, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={13} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", color: "#f8fafc" }}>BizIntel</span>
          </div>
          <div style={{ display: "flex", gap: "28px" }}>
            {["Features", "Integrations", "Pricing", "Sign in"].map(l => (
              <a key={l} href="#" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "#1e293b", margin: 0 }}>© 2025 BizIntel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
