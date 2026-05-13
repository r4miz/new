"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Send, Bot, Loader2, Plus, Trash2, MessageSquare,
  PanelLeftClose, PanelLeftOpen, Sparkles, TrendingUp,
  Users, BarChart2, Lightbulb, Target,
} from "lucide-react"
import type { Workspace, Dataset } from "@/lib/types"
import { T } from "@/lib/theme"

interface Message  { role: "user" | "assistant"; content: string; status?: string | null; isStreaming?: boolean }
interface Session  { id: string; title: string; updated_at: string }
interface Props    { workspace: Workspace; datasets: Dataset[]; userId: string; initialSessions: Session[] }

const SUGGESTED = [
  { icon: TrendingUp,   text: "What was my best month for revenue?" },
  { icon: Users,        text: "Who are my top clients by revenue?" },
  { icon: BarChart2,    text: "How is my profit margin trending?" },
  { icon: Lightbulb,   text: "What does Hormozi say about pricing?" },
  { icon: Target,       text: "What should I focus on to grow?" },
  { icon: Sparkles,     text: "What industry benchmarks should I know?" },
]

// ── Typing animation ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "7px", height: "7px",
          background: T.accent, borderRadius: "50%",
          display: "inline-block",
          animation: "bizPulse 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
          opacity: 0.4,
        }} />
      ))}
    </span>
  )
}

// ── User avatar ───────────────────────────────────────────────────────────────
function UserAvatar() {
  return (
    <div style={{
      width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
      background: `linear-gradient(135deg, ${T.accent} 0%, ${T.indigo} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 2px 8px ${T.accentGlow}`,
    }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>U</span>
    </div>
  )
}

// ── AI avatar ─────────────────────────────────────────────────────────────────
function AiAvatar({ spinning }: { spinning?: boolean }) {
  return (
    <div style={{
      width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
      background: T.surface3,
      border: `1px solid ${T.borderMd}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {spinning
        ? <Loader2 size={14} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
        : <Bot size={14} color={T.accent} />
      }
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginBottom: "24px", alignItems: "flex-start" }}>
        <div style={{
          maxWidth: "68%",
          background: `linear-gradient(135deg, ${T.accent} 0%, #0284c7 100%)`,
          borderRadius: "18px 18px 4px 18px",
          padding: "12px 18px",
          fontSize: "14.5px", lineHeight: 1.65, color: "white",
          boxShadow: `0 4px 16px ${T.accentGlow}`,
          whiteSpace: "pre-wrap",
        }}>
          {message.content}
        </div>
        <UserAvatar />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "28px", alignItems: "flex-start" }}>
      <AiAvatar spinning={!!(message.isStreaming && !message.content)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {message.status && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "12px", color: T.accent, marginBottom: "10px",
            background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)",
            borderRadius: "20px", padding: "4px 12px",
          }}>
            <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
            {message.status}
          </div>
        )}
        {message.isStreaming && !message.content && !message.status ? (
          <div style={{
            background: T.surface2, border: `1px solid ${T.border}`,
            borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "inline-block",
          }}>
            <TypingDots />
          </div>
        ) : (
          <div style={{
            fontSize: "14.5px", lineHeight: 1.75, color: T.text,
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:      ({ children }) => <p style={{ margin: "0 0 12px" }}>{children}</p>,
                h2:     ({ children }) => <h2 style={{ fontSize: "16px", fontWeight: 700, color: T.text, margin: "20px 0 8px", letterSpacing: "-0.2px" }}>{children}</h2>,
                h3:     ({ children }) => <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: T.textSec, margin: "14px 0 6px" }}>{children}</h3>,
                ul:     ({ children }) => <ul style={{ paddingLeft: "20px", margin: "8px 0 12px" }}>{children}</ul>,
                ol:     ({ children }) => <ol style={{ paddingLeft: "20px", margin: "8px 0 12px" }}>{children}</ol>,
                li:     ({ children }) => <li style={{ marginBottom: "6px", fontSize: "14.5px", lineHeight: 1.6 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: T.text, fontWeight: 700 }}>{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: `3px solid ${T.accent}`, paddingLeft: "14px",
                    margin: "12px 0", color: T.textSec, fontStyle: "italic",
                  }}>{children}</blockquote>
                ),
                code: ({ children, className }) => className?.includes("language-") ? (
                  <code style={{
                    display: "block", background: T.bg, color: "#7dd3fc",
                    padding: "14px 16px", borderRadius: "10px", fontSize: "13px",
                    fontFamily: "ui-monospace, monospace", margin: "10px 0",
                    overflowX: "auto", border: `1px solid ${T.border}`,
                  }}>{children}</code>
                ) : (
                  <code style={{
                    background: T.surface3, color: "#93c5fd",
                    padding: "2px 7px", borderRadius: "5px",
                    fontSize: "13px", fontFamily: "ui-monospace, monospace",
                    border: `1px solid ${T.border}`,
                  }}>{children}</code>
                ),
                hr: () => <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "16px 0" }} />,
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", margin: "12px 0" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "13.5px" }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.borderMd}`, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: "9px 14px", color: T.text, borderBottom: `1px solid ${T.border}` }}>{children}</td>,
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChatInterface({ workspace, datasets, userId, initialSessions }: Props) {
  const [sessions,       setSessions]       = useState<Session[]>(initialSessions)
  const [activeId,       setActiveId]       = useState<string | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState("")
  const [isLoading,      setIsLoading]      = useState(false)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { return () => { abortRef.current?.abort() } }, [activeId])

  // Auto-resize textarea
  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  async function newSession() {
    const res = await fetch("/api/chat-sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", workspace_id: workspace.id }),
    })
    const { session } = await res.json()
    setSessions(prev => [session, ...prev])
    setActiveId(session.id)
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function loadSession(id: string) {
    if (id === activeId) return
    setLoadingSession(true)
    const res = await fetch(`/api/chat-sessions?session_id=${id}`)
    const { messages: msgs } = await res.json()
    setActiveId(id)
    setMessages(msgs.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })))
    setLoadingSession(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this conversation?")) return
    await fetch("/api/chat-sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", session_id: id }),
    })
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) { setActiveId(null); setMessages([]) }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    let sessionId = activeId
    if (!sessionId) {
      const res = await fetch("/api/chat-sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", workspace_id: workspace.id, title: text.trim().slice(0, 60) }),
      })
      const { session } = await res.json()
      sessionId = session.id
      setActiveId(session.id)
      setSessions(prev => [session, ...prev])
    }

    const userMsg: Message = { role: "user", content: text.trim() }
    const asstMsg: Message = { role: "assistant", content: "", isStreaming: true }
    setMessages(prev => [...prev, userMsg, asstMsg])
    setInput("")
    if (inputRef.current) { inputRef.current.style.height = "auto" }
    setIsLoading(true)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, messages: history }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let finalContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n"); buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === "status") {
              setMessages(p => { const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], status: ev.message }; return n })
            } else if (ev.type === "text") {
              finalContent += ev.chunk
              setMessages(p => { const n = [...p]; const l = n[n.length - 1]; n[n.length - 1] = { ...l, content: (l.content ?? "") + ev.chunk, isStreaming: true, status: null }; return n })
            } else if (ev.type === "done") {
              setMessages(p => { const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], isStreaming: false, status: null }; return n })
            } else if (ev.type === "error") {
              setMessages(p => { const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], content: `Error: ${ev.message}`, isStreaming: false, status: null }; return n })
            }
          } catch { /* ignore parse errors */ }
        }
      }

      if (sessionId) {
        await fetch("/api/chat-sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_messages", session_id: sessionId,
            messages: [
              { role: "user", content: text.trim() },
              { role: "assistant", content: finalContent },
            ],
          }),
        })
        if (messages.length === 0) {
          const title = text.trim().slice(0, 60)
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s))
          fetch("/api/chat-sessions", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "rename", session_id: sessionId, title }),
          })
        }
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return
      setMessages(p => { const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], content: `Something went wrong. Please try again.`, isStreaming: false, status: null }; return n })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, isLoading, workspace.id, activeId])

  const industry = workspace.industry ?? "your industry"
  const SIDEBAR_W = 264

  return (
    <>
      <style>{`
        @keyframes bizPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .session-row:hover .session-delete { opacity: 1 !important; }
        .suggest-btn:hover { border-color: rgba(14,165,233,0.4) !important; background: rgba(14,165,233,0.06) !important; }
        .suggest-btn:hover span { color: #e2e8f0 !important; }
        .suggest-btn:hover svg { color: #0ea5e9 !important; }
      `}</style>

      <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", background: T.bg }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div style={{
          width: sidebarOpen ? `${SIDEBAR_W}px` : "0px",
          minWidth: sidebarOpen ? `${SIDEBAR_W}px` : "0px",
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "16px 12px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <button
              onClick={newSession}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 12px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600,
                background: `linear-gradient(135deg, ${T.accent} 0%, #0284c7 100%)`,
                color: "white", border: "none", cursor: "pointer",
                boxShadow: `0 2px 12px ${T.accentGlow}`,
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
            >
              <Plus size={15} />
              New conversation
            </button>
          </div>

          {/* Session list */}
          <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            {sessions.length === 0 ? (
              <div style={{ padding: "32px 12px", textAlign: "center" }}>
                <MessageSquare size={20} color={T.textDim} style={{ marginBottom: "10px", opacity: 0.5 }} />
                <p style={{ fontSize: "12.5px", color: T.textDim, margin: 0, lineHeight: 1.5 }}>
                  No conversations yet.{"\n"}Start one below.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "10.5px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 8px", margin: 0 }}>
                  Recent
                </p>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="session-row"
                    onClick={() => loadSession(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "9px 10px", borderRadius: "9px", marginBottom: "2px",
                      background: activeId === s.id ? "rgba(14,165,233,0.1)" : "transparent",
                      border: `1px solid ${activeId === s.id ? "rgba(14,165,233,0.22)" : "transparent"}`,
                      cursor: "pointer", transition: "all 0.12s",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (activeId !== s.id) (e.currentTarget as HTMLElement).style.background = T.surface2 }}
                    onMouseLeave={e => { if (activeId !== s.id) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <MessageSquare
                      size={13}
                      color={activeId === s.id ? T.accent : T.textDim}
                      style={{ flexShrink: 0 }}
                    />
                    <span style={{
                      flex: 1, fontSize: "13px",
                      fontWeight: activeId === s.id ? 600 : 400,
                      color: activeId === s.id ? T.text : T.textSec,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {s.title}
                    </span>
                    <button
                      className="session-delete"
                      onClick={e => deleteSession(s.id, e)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: T.textDim, padding: "3px", display: "flex",
                        flexShrink: 0, borderRadius: "5px",
                        opacity: 0.35, transition: "opacity 0.15s, color 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textDim }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Top bar */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: "12px",
            padding: "0 24px", height: "56px",
            borderBottom: `1px solid ${T.border}`,
            background: T.surface,
          }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: T.textMuted, padding: "6px", borderRadius: "7px",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surface2; (e.currentTarget as HTMLElement).style.color = T.text }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = T.textMuted }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div style={{ width: "1px", height: "20px", background: T.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bot size={15} color={T.accent} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>
                {industry.charAt(0).toUpperCase() + industry.slice(1)} Advisor
              </span>
            </div>
            {isLoading && (
              <div style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px",
                fontSize: "12px", color: T.accent,
                background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)",
                borderRadius: "20px", padding: "4px 12px",
              }}>
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                Thinking…
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
            <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 32px" }}>
              {loadingSession ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
                  <Loader2 size={22} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                /* ── Empty / welcome state ── */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: "40px", paddingBottom: "40px" }}>
                  {/* Hero icon */}
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "20px", marginBottom: "24px",
                    background: `linear-gradient(135deg, ${T.accent} 0%, ${T.indigo} 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 0 12px rgba(14,165,233,0.08), 0 12px 40px ${T.accentGlow}`,
                  }}>
                    <Bot size={32} color="white" />
                  </div>

                  <h2 style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: 800, color: T.text, letterSpacing: "-0.4px" }}>
                    Your {industry} advisor
                  </h2>
                  <p style={{ margin: "0 0 36px", fontSize: "15px", color: T.textMuted, maxWidth: "420px", lineHeight: 1.7 }}>
                    Ask about your data, get strategic advice, or create KPIs — powered by Hormozi, Collins, Thiel, and more.
                  </p>

                  {/* Suggestion grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "560px" }}>
                    {SUGGESTED.map(({ icon: Icon, text }) => (
                      <button
                        key={text}
                        className="suggest-btn"
                        onClick={() => sendMessage(text)}
                        style={{
                          textAlign: "left", display: "flex", alignItems: "flex-start", gap: "10px",
                          background: T.surface, border: `1px solid ${T.border}`,
                          padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Icon size={15} color={T.textDim} style={{ flexShrink: 0, marginTop: "1px", transition: "color 0.15s" }} />
                        <span style={{ fontSize: "13px", color: T.textSec, lineHeight: 1.45, transition: "color 0.15s" }}>
                          {text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => <Bubble key={i} message={msg} />)}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
          </div>

          {/* ── Input bar ─────────────────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: "16px 32px 20px",
            background: T.surface,
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{
              maxWidth: "760px", margin: "0 auto",
              background: T.surface2,
              border: `1.5px solid ${T.borderMd}`,
              borderRadius: "16px",
              display: "flex", alignItems: "flex-end", gap: "8px",
              padding: "10px 10px 10px 18px",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
              onFocusCapture={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = T.accent
                el.style.boxShadow = `0 0 0 3px rgba(14,165,233,0.12)`
              }}
              onBlurCapture={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = T.borderMd
                el.style.boxShadow = "none"
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={e => { setInput(e.target.value); resizeTextarea(e.target) }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                disabled={isLoading}
                placeholder={`Ask about your ${industry} data…`}
                style={{
                  flex: 1, resize: "none", background: "transparent",
                  border: "none", outline: "none",
                  fontSize: "15px", color: T.text, lineHeight: 1.6,
                  maxHeight: "160px", overflowY: "auto",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                style={{
                  width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px",
                  background: isLoading || !input.trim()
                    ? T.surface3
                    : `linear-gradient(135deg, ${T.accent} 0%, #0284c7 100%)`,
                  border: "none",
                  cursor: isLoading || !input.trim() ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: !isLoading && input.trim() ? `0 4px 14px ${T.accentGlow}` : "none",
                  transition: "all 0.18s",
                  flexDirection: "column",
                }}
              >
                {isLoading
                  ? <Loader2 size={16} color={T.textMuted} style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={16} color={input.trim() ? "white" : T.textDim} />
                }
              </button>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: T.textDim, textAlign: "center" }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
