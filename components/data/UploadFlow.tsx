"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Workspace } from "@/lib/types"
import { Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react"

type Step = "idle" | "uploading" | "parsing" | "proposing" | "done" | "error"

interface Props {
  workspace: Workspace
}

export function UploadFlow({ workspace }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState("")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    // Pre-fill dataset name from filename
    setDatasetName(f.name.replace(/\.(csv|xlsx|xls)$/i, ""))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setError(null)

    try {
      // Step 1: Upload CSV
      setStep("uploading")
      setStatusText("Uploading and parsing your file…")
      const form = new FormData()
      form.append("file", file)
      form.append("workspace_id", workspace.id)
      form.append("name", datasetName || file.name)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed")

      const datasetId = uploadData.dataset.id

      // Step 2: AI parse
      setStep("parsing")
      setStatusText("AI is analyzing your data columns…")
      const parseRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, workspace_id: workspace.id }),
      })
      const parseData = await parseRes.json()
      if (!parseRes.ok) throw new Error(parseData.error ?? "AI parse failed")

      // Step 3: AI propose KPI
      setStep("proposing")
      setStatusText("AI is proposing a KPI for your dashboard…")
      const proposeRes = await fetch("/api/ai/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, workspace_id: workspace.id }),
      })
      const proposeData = await proposeRes.json()
      if (!proposeRes.ok) throw new Error(proposeData.error ?? "KPI proposal failed")

      setStep("done")
      setStatusText("Done! Redirecting to your dashboard…")
      setTimeout(() => {
        router.push(`/w/${workspace.slug}/dashboard`)
      }, 1200)
    } catch (err: unknown) {
      setStep("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (step !== "idle" && step !== "error") {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        {step === "done" ? (
          <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
        ) : (
          <Loader2 className="text-blue-600 mx-auto mb-3 animate-spin" size={40} />
        )}
        <p className="text-slate-700 font-medium">{statusText}</p>
        <div className="mt-4 flex justify-center gap-2">
          {(["uploading", "parsing", "proposing", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full ${
                ["uploading", "parsing", "proposing", "done"].indexOf(step) >= i
                  ? "bg-blue-600"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dropzone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-10 text-center cursor-pointer transition"
      >
        <Upload className="mx-auto mb-3 text-slate-400" size={32} />
        {file ? (
          <div>
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-slate-700">Drop a CSV here or click to browse</p>
            <p className="text-sm text-slate-400 mt-1">CSV files up to 4 MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {file && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Dataset name
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Monthly Sales"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition"
      >
        Upload and generate KPI
      </button>
    </form>
  )
}
