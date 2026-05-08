"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Workspace } from "@/lib/types"
import { Upload, CheckCircle, Loader2, AlertCircle, FileText, X, ArrowRight } from "lucide-react"
import { T } from "@/lib/theme"

type Step = "idle" | "uploading" | "parsing" | "proposing" | "done" | "error"
interface Props { workspace: Workspace }

const STEPS = [
  { key: "uploading", label: "Parsing file"   },
  { key: "parsing",   label: "Analyzing data" },
  { key: "proposing", label: "Building KPIs"  },
  { key: "done",      label: "Complete"        },
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
  const [nameFocused, setNameFocused] = useState(false)

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
      setTimeout(() => router.push(`/w/${workspace.slug}/dashboard`), 1200)
    } catch (err) {
      setStep("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // ── Processing state ──────────────────────────────────────────────────────
  if (step !== "idle" && step !== "error") {
    const idx  = STEPS.findIndex(s => s.key === step)
    const done = step === "done"

    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: "14px", padding: "48px 40px", textAlign: "center",
      }}>
        {/* Spinner / check */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 24px",
          background: done ? "rgba(16,185,129,0.1)" : T.accentDim,
          border: `1.5px solid ${done ? "rgba(16,185,129,0.3)" : T.borderMd}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {done
            ? <CheckCircle size={28} color={T.green} />
            : <Loader2 size={28} color={T.accent} className="animate-spin" />}
        </div>

        <h3 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>
          {done ? "Dashboard ready!" : "Building your dashboard…"}
        </h3>
        <p style={{ margin: "0 0 40px", fontSize: "14px", color: T.textMuted }}>{statusText}</p>

        {/* Step track */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0" }}>
          {STEPS.map((s, i) => {
            const complete = i < idx || done
            const current  = i === idx && !done
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: complete ? T.accent : current ? T.accentDim : T.surface2,
                    border: `1.5px solid ${complete ? T.accent : current ? "rgba(14,165,233,0.4)" : T.border}`,
                    transition: "all 0.3s ease",
                  }}>
                    {complete
                      ? <CheckCircle size={13} color="white" />
                      : <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: current ? T.accent : T.textDim }} />}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: complete ? T.accent : current ? T.textSec : T.textDim, whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: "48px", height: "1.5px", background: complete ? T.accent : T.border, margin: "0 0 22px", transition: "background 0.3s" }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Idle / error state ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          background: dragging ? "rgba(14,165,233,0.06)" : file ? "rgba(14,165,233,0.04)" : T.surface,
          border: `1.5px ${dragging ? "solid" : file ? "solid" : "dashed"} ${dragging ? T.accent : file ? "rgba(14,165,233,0.4)" : T.borderMd}`,
          borderRadius: "12px",
          padding: file ? "20px 24px" : "48px 24px",
          textAlign: "center", cursor: "pointer",
          transition: "all 0.18s ease",
          outline: "none",
        }}
      >
        <input
          ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) pick(f) }}
        />

        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
              background: T.accentDim, border: `1px solid rgba(14,165,233,0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={20} color={T.accent} />
            </div>
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.textMuted }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove file"
              onClick={e => { e.stopPropagation(); setFile(null); setDatasetName("") }}
              style={{
                background: T.surface2, border: `1px solid ${T.border}`,
                borderRadius: "6px", cursor: "pointer", color: T.textMuted,
                padding: "6px", display: "flex", flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px", margin: "0 auto 16px",
              background: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))",
              border: `1px solid rgba(14,165,233,0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Upload size={22} color={T.accent} />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: T.textSec }}>
              Drop your file here, or <span style={{ color: T.accent }}>browse</span>
            </p>
            <p style={{ margin: 0, fontSize: "12.5px", color: T.textDim }}>
              CSV, XLSX, XLS · up to 4 MB · First row = column headers
            </p>
          </>
        )}
      </div>

      {/* Dataset name */}
      {file && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "7px" }}>
            Dataset name
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={e => setDatasetName(e.target.value)}
            placeholder="e.g. Monthly Sales 2024"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 14px",
              background: T.surface2,
              border: `1px solid ${nameFocused ? T.accent : T.borderMd}`,
              borderRadius: "8px", fontSize: "14px", color: T.text, outline: "none",
              boxShadow: nameFocused ? `0 0 0 3px ${T.accentDim}` : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "10px", padding: "12px 16px",
        }}>
          <AlertCircle size={14} color={T.red} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "13px", color: "#fca5a5" }}>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "14px", borderRadius: "10px", width: "100%",
          background: !file ? T.surface2 : T.accent,
          color: !file ? T.textDim : "white",
          border: `1px solid ${!file ? T.border : "transparent"}`,
          cursor: !file ? "not-allowed" : "pointer",
          fontSize: "14px", fontWeight: 700,
          boxShadow: file ? `0 4px 20px ${T.accentGlow}` : "none",
          transition: "all 0.18s ease",
          opacity: !file ? 0.6 : 1,
        }}
      >
        <Upload size={15} />
        Upload and generate dashboard
        {file && <ArrowRight size={14} />}
      </button>
    </form>
  )
}
