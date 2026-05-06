"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Workspace } from "@/lib/types"
import { Upload, CheckCircle, Loader2, AlertCircle, FileText, X } from "lucide-react"

type Step = "idle" | "uploading" | "parsing" | "proposing" | "done" | "error"
interface Props { workspace: Workspace }

const STEPS_INFO = [
  { key: "uploading", label: "Parsing your file" },
  { key: "parsing",   label: "Analyzing columns"  },
  { key: "proposing", label: "Building KPIs"       },
  { key: "done",      label: "Complete"            },
]

export function UploadFlow({ workspace }: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file,        setFile]        = useState<File | null>(null)
  const [dragging,    setDragging]    = useState(false)
  const [datasetName, setDatasetName] = useState("")
  const [step,        setStep]        = useState<Step>("idle")
  const [statusText,  setStatusText]  = useState("")
  const [error,       setError]       = useState<string | null>(null)

  function pick(f: File) {
    setFile(f)
    setDatasetName(f.name.replace(/\.(csv|xlsx|xls)$/i, "").replace(/[-_]/g, " "))
    setError(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pick(f)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    try {
      setStep("uploading"); setStatusText("Parsing your file…")
      const form = new FormData()
      form.append("file", file)
      form.append("workspace_id", workspace.id)
      form.append("name", datasetName || file.name)
      const r1 = await fetch("/api/upload", { method: "POST", body: form })
      const d1 = await r1.json()
      if (!r1.ok) throw new Error(d1.error ?? "Upload failed")

      setStep("parsing"); setStatusText("AI is analyzing your column types…")
      const r2 = await fetch("/api/ai/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: d1.dataset.id, workspace_id: workspace.id }),
      })
      if (!r2.ok) throw new Error((await r2.json()).error ?? "Parse failed")

      setStep("proposing"); setStatusText("Generating your KPI dashboard…")
      const r3 = await fetch("/api/ai/propose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: d1.dataset.id, workspace_id: workspace.id }),
      })
      if (!r3.ok) throw new Error((await r3.json()).error ?? "Propose failed")

      setStep("done"); setStatusText("Your dashboard is ready!")
      setTimeout(() => router.push(`/w/${workspace.slug}/dashboard`), 1000)
    } catch (err) {
      setStep("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // ── Processing state ───────────────────────────────────────────────────────
  if (step !== "idle" && step !== "error") {
    const idx  = STEPS_INFO.findIndex(s => s.key === step)
    const done = step === "done"

    return (
      <div style={{
        background: "white", borderRadius: "14px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        padding: "48px 40px",
        textAlign: "center",
      }}>
        {done ? (
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#ecfdf5", border: "2px solid #a7f3d0",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
          }}>
            <CheckCircle size={28} color="#059669" />
          </div>
        ) : (
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#eff6ff", border: "2px solid #bfdbfe",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
          }}>
            <Loader2 size={28} color="#2563eb" className="animate-spin" />
          </div>
        )}

        <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
          {done ? "Dashboard ready!" : "Building your dashboard…"}
        </h3>
        <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#64748b" }}>{statusText}</p>

        {/* Progress steps */}
        <div style={{ display: "flex", gap: "0", justifyContent: "center" }}>
          {STEPS_INFO.map((s, i) => {
            const complete = i < idx || done
            const current  = i === idx && !done
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: complete || done ? "#0ea5e9" : current ? "#eff6ff" : "#f8fafc",
                    border: `2px solid ${complete || done ? "#0ea5e9" : current ? "#93c5fd" : "#e2e8f0"}`,
                    transition: "all 0.3s",
                  }}>
                    {complete || done ? (
                      <CheckCircle size={14} color="white" />
                    ) : (
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: current ? "#2563eb" : "#cbd5e1" }} />
                    )}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 500, color: complete || done ? "#0ea5e9" : current ? "#374151" : "#9ca3af", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS_INFO.length - 1 && (
                  <div style={{ width: "40px", height: "2px", background: complete ? "#0ea5e9" : "#e2e8f0", margin: "0 4px 20px", transition: "background 0.3s" }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Idle / error state ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Dropzone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#0ea5e9" : file ? "#a5f3fc" : "#e2e8f0"}`,
          borderRadius: "12px",
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "#f0f9ff" : file ? "#f0f9ff" : "white",
          transition: "all 0.18s",
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) pick(f) }} />

        {file ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} color="#0ea5e9" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{file.name}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null); setDatasetName("") }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", marginLeft: "4px" }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#0ea5e9", fontWeight: 500 }}>Click to change file</p>
          </div>
        ) : (
          <div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Upload size={22} color="#94a3b8" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#374151" }}>
              Drop your CSV here, or click to browse
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
              CSV files up to 4 MB · First row must be headers
            </p>
          </div>
        )}
      </div>

      {/* Dataset name */}
      {file && (
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "7px" }}>
            Dataset name
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={e => setDatasetName(e.target.value)}
            placeholder="e.g. Monthly Sales 2024"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 14px", border: "1.5px solid #e5e7eb",
              borderRadius: "8px", fontSize: "14px", color: "#0f172a",
              outline: "none", background: "white",
            }}
            onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)" }}
            onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none" }}
          />
        </div>
      )}

      {/* Error */}
      {(error || step === "error") && error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px" }}>
          <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "13px", color: "#b91c1c" }}>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "13px", borderRadius: "9px", width: "100%",
          background: !file ? "#e2e8f0" : "#0f172a",
          color: !file ? "#9ca3af" : "white",
          border: "none", cursor: !file ? "default" : "pointer",
          fontSize: "14px", fontWeight: 700, letterSpacing: "-0.1px",
          transition: "background 0.15s",
        }}
      >
        <Upload size={15} />
        Upload and generate dashboard
      </button>
    </form>
  )
}
