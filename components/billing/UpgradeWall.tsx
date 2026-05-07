import { Lock } from "lucide-react"
import { PricingCards } from "./PricingCards"

interface Props {
  workspace: { id: string; name: string }
}

export function UpgradeWall({ workspace }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#07090e" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 36px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px",
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
          }}>
            <Lock size={24} color="#0ea5e9" />
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "28px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            Your free trial has ended
          </h1>
          <p style={{ margin: "0 auto", fontSize: "15px", color: "#475569", maxWidth: "440px", lineHeight: 1.7 }}>
            Choose a plan to restore access to{" "}
            <span style={{ fontWeight: 600, color: "#94a3b8" }}>{workspace.name}</span>{" "}
            and keep your AI-powered dashboard running.
          </p>
        </div>

        <PricingCards workspaceId={workspace.id} />
      </div>
    </div>
  )
}
