"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react"
import type { Workspace, Dataset } from "@/lib/types"

interface Message { role: "user" | "assistant"; content: string; status?: string | null; isStreaming?: boolean }
interface Props { workspace: Workspace; datasets: Dataset[] }

const SUGGESTED = [
  "What was my best month for revenue?",
  "Who are my top clients by revenue?",
  "How is my profit margin trending?",
  "What should I focus on to grow this quarter?",
  "Compare performance across categories.",
  "What are industry benchmarks I should know?",
]

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: "6px", height: "6px", background: "#475569", borderRadius: "50%", animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s`, display: "inline-block" }} />
      ))}
    </span>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div style={{ display: "flex", gap: "12px", flexDirection: isUser ? "row-reverse" : "row", marginBottom: "20px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "#0ea5e9" : "#141d2e",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
      }}>
        {isUser ? <User size={15} color="white" /> : <Bot size={15} color="#64748b" />}
      </div>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: "4px", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {message.status && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569", marginBottom: "4px" }}>
            <Loader2 size={11} className="animate-spin" />
            {message.status}
          </div>
        )}
        <div style={{
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "12px 16px", fontSize: "14px", lineHeight: 1.65,
          background: isUser ? "#0ea5e9" : "#0d1117",
          color: isUser ? "white" : "#d1d5db",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isUser ? "0 4px 12px rgba(14,165,233,0.2)" : "none",
        }}>
          {message.isStreaming && !message.content ? <TypingDots /> : isUser ? (
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:  ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
                h2: ({ children }) => <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9", margin: "12px 0 6px" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", margin: "10px 0 4px" }}>{children}</h3>,
                ul: ({ children }) => <ul style={{ paddingLeft: "16px", margin: "6px 0" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: "16px", margin: "6px 0" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "4px", fontSize: "14px" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: "#f1f5f9", fontWeight: 600 }}>{children}</strong>,
                code: ({ children, className }) => className?.includes("language-") ? (
                  <code style={{ display: "block", background: "#07090e", color: "#7dd3fc", padding: "12px", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace", margin: "8px 0", overflow: "auto" }}>{children}</code>
                ) : (
                  <code style={{ background: "#07090e", color: "#7dd3fc", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>{children}</code>
                ),
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatInterface({ workspace, datasets }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState("")
  const [isLoading,  setIsLoading]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: Message = { role: "user", content: text.trim() }
    const asstMsg: Message = { role: "assistant", content: "", isStreaming: true, status: null }
    setMessages(prev => [...prev, userMsg, asstMsg])
    setInput(""); setIsLoading(true)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, messages: history }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n"); buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === "status") setMessages(p => { const n=[...p]; n[n.length-1]={...n[n.length-1],status:ev.message}; return n })
            else if (ev.type === "text") setMessages(p => { const n=[...p]; const l=n[n.length-1]; n[n.length-1]={...l,content:(l.content??"")+ev.chunk,isStreaming:true,status:null}; return n })
            else if (ev.type === "done") setMessages(p => { const n=[...p]; n[n.length-1]={...n[n.length-1],isStreaming:false,status:null}; return n })
            else if (ev.type === "error") setMessages(p => { const n=[...p]; n[n.length-1]={...n[n.length-1],content:`Error: ${ev.message}`,isStreaming:false,status:null}; return n })
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setMessages(p => { const n=[...p]; n[n.length-1]={...n[n.length-1],content:`Connection error: ${String(e)}`,isStreaming:false,status:null}; return n })
    } finally {
      setIsLoading(false); inputRef.current?.focus()
    }
  }, [messages, isLoading, workspace.id])

  const industry = workspace.industry ?? "your industry"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#07090e" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", paddingBottom: "60px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "16px", marginBottom: "20px",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(14,165,233,0.3)",
            }}>
              <Bot size={28} color="white" />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.4px" }}>
              Your {industry} advisor
            </h2>
            <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#475569", maxWidth: "380px", lineHeight: 1.65 }}>
              Ask anything about your business data or get expert strategic advice. I combine your real numbers with deep industry knowledge.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "520px" }}>
              {SUGGESTED.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{
                  textAlign: "left", fontSize: "13px", color: "#64748b",
                  background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
                  padding: "12px 16px", borderRadius: "10px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,165,233,0.4)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
                >
                  {p}
                </button>
              ))}
            </div>
            {datasets.length === 0 && (
              <p style={{ marginTop: "20px", fontSize: "12px", color: "#334155", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px", padding: "8px 16px" }}>
                No data uploaded yet — I can still answer industry questions
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0d1117", padding: "16px 32px 20px" }}>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{
            display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155",
            background: "none", border: "none", cursor: "pointer", marginBottom: "10px",
            transition: "color 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#64748b"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#334155"}
          >
            <RotateCcw size={11} /> New conversation
          </button>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
          <textarea
            ref={inputRef} value={input} rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            disabled={isLoading}
            placeholder={`Ask about your data or get ${industry} advice…`}
            style={{
              flex: 1, resize: "none", background: "#141d2e",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
              padding: "12px 16px", fontSize: "14px", color: "#f8fafc",
              outline: "none", maxHeight: "140px", overflowY: "auto",
              lineHeight: 1.5, transition: "border-color 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(14,165,233,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.08)" }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none" }}
          />
          <button
            onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
            style={{
              width: "42px", height: "42px", flexShrink: 0, borderRadius: "10px",
              background: isLoading || !input.trim() ? "#141d2e" : "#0ea5e9",
              border: "none", cursor: isLoading || !input.trim() ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
              boxShadow: !isLoading && input.trim() ? "0 4px 12px rgba(14,165,233,0.25)" : "none",
            }}
          >
            {isLoading ? <Loader2 size={16} color="#334155" className="animate-spin" /> : <Send size={16} color={input.trim() ? "white" : "#334155"} />}
          </button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#1e293b", textAlign: "center" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
