"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Workspace } from "@/lib/types"
import { Upload, CheckCircle, Loader2, AlertCircle, FileText, X } from "lucide-react"

type Step = "idle" | "uploading" | "parsing" | "proposing" | "done" | "error"
interface Props { workspace: Workspace }

const STEPS = [
  { key: "uploading", label: "Parsing file"    },
  { key: "parsing",   label: "Analyzing data"  },
  { key: "proposing", label: "Building KPIs"   },
  { key: "done",      label: "Complete"         },
]

const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  background: "#141d2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", fontSize: "14px", color: "#f8fafc", outline: "none",
  transition: "border-color 0.15s",
}

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
    const f = e.dataTransfer.files[0]; if (f) pick(f)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!file) return
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

  if (step !== "idle" && step !== "error") {
    const idx  = STEPS.findIndex(s => s.key === step)
    const done = step === "done"

    return (
      <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 20px",
          background: done ? "rgba(16,185,129,0.12)" : "rgba(14,165,233,0.12)",
          border: `2px solid ${done ? "rgba(16,185,129,0.3)" : "rgba(14,165,233,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {done
            ? <CheckCircle size={26} color="#34d399" />
            : <Loader2 size={26} color="#0ea5e9" className="animate-spin" />}
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>
          {done ? "Dashboard ready!" : "Building your dashboard…"}
        </h3>
        <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#475569" }}>{statusText}</p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}>
          {STEPS.map((s, i) => {
            const complete = i < idx || done
            const current  = i === idx && !done
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: complete || done ? "#0ea5e9" : current ? "rgba(14,165,233,0.12)" : "#141d2e",
                    border: `2px solid ${complete || done ? "#0ea5e9" : current ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.3s",
                  }}>
                    {complete || done
                      ? <CheckCircle size={13} color="white" />
                      : <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: current ? "#0ea5e9" : "#334155" }} />}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 500, color: complete || done ? "#0ea5e9" : current ? "#94a3b8" : "#334155", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: "32px", height: "2px", background: complete ? "#0ea5e9" : "#141d2e", margin: "0 2px 20px", transition: "background 0.3s" }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Dropzone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#0ea5e9" : file ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "12px", padding: "40px 24px", textAlign: "center",
          cursor: "pointer", background: dragging ? "rgba(14,165,233,0.05)" : file ? "rgba(14,165,233,0.03)" : "#0d1117",
          transition: "all 0.18s",
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) pick(f) }} />

        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={20} color="#0ea5e9" />
            </div>
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setDatasetName("") }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "4px", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#141d2e", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Upload size={22} color="#475569" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#94a3b8" }}>
              Drop your CSV here, or click to browse
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#334155" }}>CSV files up to 4 MB · First row must be column headers</p>
          </>
        )}
      </div>

      {file && (
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#64748b", marginBottom: "7px" }}>
            Dataset name
          </label>
          <input
            type="text" value={datasetName} onChange={e => setDatasetName(e.target.value)}
            placeholder="e.g. Monthly Sales 2024" style={INPUT}
            onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)" }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none" }}
          />
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
          <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "13px", color: "#fca5a5" }}>{error}</span>
        </div>
      )}

      <button type="submit" disabled={!file} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        padding: "13px", borderRadius: "9px", width: "100%",
        background: !file ? "#141d2e" : "#0ea5e9",
        color: !file ? "#334155" : "white",
        border: "none", cursor: !file ? "default" : "pointer",
        fontSize: "14px", fontWeight: 700, transition: "background 0.15s",
        boxShadow: file ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
      }}>
        <Upload size={15} />
        Upload and generate dashboard
      </button>
    </form>
  )
}
