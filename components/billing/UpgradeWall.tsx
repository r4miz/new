import { Lock } from "lucide-react"
import { PricingCards } from "./PricingCards"
import { T } from "@/lib/theme"

interface Props { workspace: { id: string; name: string } }

export function UpgradeWall({ workspace }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "64px 28px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "52px", height: "52px", borderRadius: "14px", marginBottom: "20px",
          background: T.accentDim, border: `1px solid rgba(14,165,233,0.2)`,
        }}>
          <Lock size={22} color={T.accent} />
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: 800, color: T.text, letterSpacing: "-0.4px" }}>
          Subscribe to get started
        </h1>
        <p style={{ margin: "0 auto 40px", fontSize: "14px", color: T.textMuted, maxWidth: "380px", lineHeight: 1.7 }}>
          Choose a plan to unlock{" "}
          <span style={{ fontWeight: 600, color: T.textSec }}>{workspace.name}</span>{" "}
          and start turning your data into decisions.
        </p>
        <PricingCards workspaceId={workspace.id} />
      </div>
    </div>
  )
}
