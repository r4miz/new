// Central design tokens
export const T = {
  bg:        "#060d1a",
  surface:   "#0b1629",
  surface2:  "#0f1e38",
  surface3:  "#162442",
  border:    "rgba(255,255,255,0.06)",
  borderMd:  "rgba(255,255,255,0.10)",
  borderHi:  "rgba(255,255,255,0.18)",
  text:      "#e2e8f0",
  textSec:   "#94a3b8",
  textMuted: "#64748b",
  textDim:   "#475569",
  accent:    "#0ea5e9",
  accentDim: "rgba(14,165,233,0.12)",
  accentGlow:"rgba(14,165,233,0.22)",
  indigo:    "#6366f1",
  green:     "#10b981",
  amber:     "#f59e0b",
  red:       "#ef4444",
  purple:    "#8b5cf6",
  shadow1:   "0 1px 4px rgba(0,0,0,0.5)",
  shadow2:   "0 4px 16px rgba(0,0,0,0.55)",
  shadow3:   "0 8px 40px rgba(0,0,0,0.65)",
  r3: "8px", r4: "10px", r5: "12px", r6: "16px",
} as const

// Legacy alias so older imports don't break during transition
export const D = T
