"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Send, Bot, User, Loader2, Plus, Trash2,
  MessageSquare, ChevronLeft, ChevronRight,
} from "lucide-react"
import type { Workspace, Dataset } from "@/lib/types"
import { T } from "@/lib/theme"

interface Message  { role: "user" | "assistant"; content: string; status?: string | null; isStreaming?: boolean }
interface Session  { id: string; title: string; updated_at: string }
interface Props    { workspace: Workspace; datasets: Dataset[]; userId: string; initialSessions: Session[] }

const SUGGESTED = [
  "What was my best month for revenue?",
  "Who are my top clients by revenue?",
  "How is my profit margin trending?",
  "What does Hormozi say about pricing?",
  "What should I focus on to grow this quarter?",
  "What are industry benchmarks I should know?",
]

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: "6px", height: "6px", background: T.textMuted, borderRadius: "50%", display: "inline-block", animation: `bounce 1s infinite`, animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div style={{ display: "flex", gap: "10px", flexDirection: isUser ? "row-reverse" : "row", marginBottom: "18px" }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isUser ? T.accent : T.surface2, border: isUser ? "none" : `1px solid ${T.border}` }}>
        {isUser ? <User size={13} color="white" /> : <Bot size={13} color={T.textMuted} />}
      </div>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "4px", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {message.status && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: T.textMuted, marginBottom: "2px" }}>
            <Loader2 size={10} className="animate-spin" /> {message.status}
          </div>
        )}
        <div style={{
          borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          padding: "11px 15px", fontSize: "14px", lineHeight: 1.65,
          background: isUser ? T.accent : T.surface,
          color: isUser ? "white" : T.text,
          border: isUser ? "none" : `1px solid ${T.border}`,
          boxShadow: isUser ? `0 4px 12px ${T.accentGlow}` : "none",
        }}>
          {message.isStreaming && !message.content ? <TypingDots /> : isUser ? (
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:      ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
                h2:     ({ children }) => <h2 style={{ fontSize: "15px", fontWeight: 700, color: T.text, margin: "14px 0 6px" }}>{children}</h2>,
                h3:     ({ children }) => <h3 style={{ fontSize: "14px", fontWeight: 600, color: T.textSec, margin: "10px 0 4px" }}>{children}</h3>,
                ul:     ({ children }) => <ul style={{ paddingLeft: "18px", margin: "6px 0" }}>{children}</ul>,
                ol:     ({ children }) => <ol style={{ paddingLeft: "18px", margin: "6px 0" }}>{children}</ol>,
                li:     ({ children }) => <li style={{ marginBottom: "4px", fontSize: "14px" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: T.text, fontWeight: 600 }}>{children}</strong>,
                code:   ({ children, className }) => className?.includes("language-") ? (
                  <code style={{ display: "block", background: T.bg, color: "#7dd3fc", padding: "12px", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace", margin: "8px 0", overflowX: "auto" }}>{children}</code>
                ) : (
                  <code style={{ background: T.bg, color: "#7dd3fc", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>{children}</code>
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

// ── Main component ────────────────────────────────────────────────────────────
export function ChatInterface({ workspace, datasets, userId, initialSessions }: Props) {
  const [sessions,    setSessions]    = useState<Session[]>(initialSessions)
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState("")
  const [isLoading,   setIsLoading]   = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // ── Create new session ──────────────────────────────────────────────────────
  async function newSession() {
    const res  = await fetch("/api/chat-sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", workspace_id: workspace.id }),
    })
    const { session } = await res.json()
    setSessions(prev => [session, ...prev])
    setActiveId(session.id)
    setMessages([])
    inputRef.current?.focus()
  }

  // ── Load session messages ───────────────────────────────────────────────────
  async function loadSession(id: string) {
    if (id === activeId) return
    setLoadingSession(true)
    const res  = await fetch(`/api/chat-sessions?session_id=${id}`)
    const { messages: msgs } = await res.json()
    setActiveId(id)
    setMessages(msgs.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })))
    setLoadingSession(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Delete session ──────────────────────────────────────────────────────────
  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch("/api/chat-sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", session_id: id }),
    })
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) { setActiveId(null); setMessages([]) }
  }

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // Create session on first message if none active
    let sessionId = activeId
    if (!sessionId) {
      const res  = await fetch("/api/chat-sessions", {
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
    const newMessages = [...messages, userMsg, asstMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

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

      // Persist both messages to DB
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
        // Auto-title session from first message
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
      setMessages(p => { const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], content: `Connection error: ${String(e)}`, isStreaming: false, status: null }; return n })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, isLoading, workspace.id, activeId])

  const industry = workspace.industry ?? "your industry"
  const SIDEBAR_W = 220

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>

      {/* ── History sidebar ─────────────────────────────────────────────────── */}
      <div style={{
        width: sidebarOpen ? `${SIDEBAR_W}px` : "0px",
        minWidth: sidebarOpen ? `${SIDEBAR_W}px` : "0px",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s ease, min-width 0.2s ease",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ padding: "14px 12px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={newSession} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "7px",
            padding: "8px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            background: T.accentDim, border: `1px solid rgba(14,165,233,0.2)`,
            color: T.accent, cursor: "pointer",
          }}>
            <Plus size={14} /> New chat
          </button>
        </div>

        {/* Session list */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {sessions.length === 0 && (
            <p style={{ fontSize: "12px", color: T.textDim, textAlign: "center", marginTop: "20px" }}>
              No conversations yet
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => loadSession(s.id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 9px", borderRadius: "7px", marginBottom: "2px",
                background: activeId === s.id ? T.accentDim : "transparent",
                border: `1px solid ${activeId === s.id ? "rgba(14,165,233,0.2)" : "transparent"}`,
                cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (activeId !== s.id) (e.currentTarget as HTMLElement).style.background = T.surface2 }}
              onMouseLeave={e => { if (activeId !== s.id) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <MessageSquare size={12} color={activeId === s.id ? T.accent : T.textDim} style={{ flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: "12px", fontWeight: activeId === s.id ? 600 : 400,
                color: activeId === s.id ? T.accent : T.textSec,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {s.title}
              </span>
              <button
                onClick={e => deleteSession(s.id, e)}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, padding: "2px", display: "flex", flexShrink: 0, borderRadius: "4px", opacity: 0 }}
                className="delete-btn"
                aria-label="Delete conversation"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, position: "relative" }}>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, width: "18px", height: "48px",
            background: T.surface2, border: `1px solid ${T.border}`,
            borderLeft: "none", borderRadius: "0 6px 6px 0",
            cursor: "pointer", color: T.textMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Toggle chat history"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 28px 36px" }}>
          {loadingSession ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Loader2 size={20} color={T.textMuted} className="animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", paddingBottom: "60px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", marginBottom: "18px", background: `linear-gradient(135deg, ${T.accent}, ${T.indigo})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${T.accentGlow}` }}>
                <Bot size={24} color="white" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>
                Your {industry} advisor
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: "13.5px", color: T.textMuted, maxWidth: "360px", lineHeight: 1.65 }}>
                Ask anything about your business data or get expert strategic advice — backed by Hormozi, Collins, Thiel, and more.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", maxWidth: "500px" }}>
                {SUGGESTED.map(p => (
                  <button key={p} onClick={() => sendMessage(p)} style={{
                    textAlign: "left", fontSize: "12.5px", color: T.textMuted,
                    background: T.surface, border: `1px solid ${T.border}`,
                    padding: "11px 14px", borderRadius: "9px", cursor: "pointer",
                    transition: "all 0.15s", lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,165,233,0.35)"; (e.currentTarget as HTMLElement).style.color = T.textSec }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.textMuted }}
                  >
                    {p}
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

        {/* Input bar */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.surface, padding: "14px 28px 18px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              disabled={isLoading}
              placeholder={`Ask about your data or get ${industry} advice…`}
              style={{
                flex: 1, resize: "none", background: T.surface2,
                border: `1px solid ${T.borderMd}`, borderRadius: "10px",
                padding: "11px 15px", fontSize: "14px", color: T.text,
                outline: "none", maxHeight: "140px", overflowY: "auto",
                lineHeight: 1.5, transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentDim}` }}
              onBlur={e => { e.target.style.borderColor = T.borderMd; e.target.style.boxShadow = "none" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={{
                width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px",
                background: isLoading || !input.trim() ? T.surface2 : T.accent,
                border: "none", cursor: isLoading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: !isLoading && input.trim() ? `0 4px 12px ${T.accentGlow}` : "none",
                transition: "all 0.15s",
              }}
            >
              {isLoading ? <Loader2 size={15} color={T.textMuted} className="animate-spin" /> : <Send size={15} color={input.trim() ? "white" : T.textDim} />}
            </button>
          </div>
          <p style={{ margin: "7px 0 0", fontSize: "11px", color: T.textDim, textAlign: "center" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`.delete-btn { opacity: 0 !important; } div:hover > .delete-btn { opacity: 1 !important; }`}</style>
    </div>
  )
}
