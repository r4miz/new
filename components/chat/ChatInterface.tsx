"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react"
import type { Workspace, Dataset } from "@/lib/types"

interface Message {
  role: "user" | "assistant"
  content: string
  status?: string | null
  isStreaming?: boolean
}

interface Props {
  workspace: Workspace
  datasets: Dataset[]
}

const SUGGESTED = [
  "What was my best month for revenue?",
  "Who are my top clients by revenue?",
  "How is my profit margin trending?",
  "What should I focus on to grow revenue this quarter?",
  "Compare my performance this year vs last year.",
  "What are common pricing strategies in my industry?",
]

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
        isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
      }`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Status line (while streaming) */}
        {message.status && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Loader2 size={11} className="animate-spin" />
            {message.status}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
        }`}>
          {message.isStreaming && !message.content ? (
            <TypingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h1:     ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                h2:     ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                h3:     ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                ul:     ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol:     ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li:     ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em:     ({ children }) => <em className="italic">{children}</em>,
                code:   ({ children, className }) => {
                  const isBlock = className?.includes("language-")
                  return isBlock ? (
                    <code className="block bg-slate-900 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono my-2 overflow-x-auto whitespace-pre">
                      {children}
                    </code>
                  ) : (
                    <code className="bg-slate-100 text-slate-700 rounded px-1 py-0.5 text-xs font-mono">
                      {children}
                    </code>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="text-xs border-collapse w-full">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold text-slate-700">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-slate-200 px-2 py-1 text-slate-600">{children}</td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-blue-300 pl-3 italic text-slate-500 my-2">{children}</blockquote>
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = { role: "user", content: text.trim() }
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true, status: null }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setIsLoading(true)

    // Build API message history (exclude in-progress assistant placeholder)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, messages: history }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === "status") {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], status: event.message }
                return next
              })
            } else if (event.type === "text") {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                next[next.length - 1] = {
                  ...last,
                  content: (last.content ?? "") + event.chunk,
                  isStreaming: true,
                  status: null,
                }
                return next
              })
            } else if (event.type === "done") {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], isStreaming: false, status: null }
                return next
              })
            } else if (event.type === "error") {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: `Sorry, something went wrong: ${event.message}`,
                  isStreaming: false,
                  status: null,
                }
                return next
              })
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: `Connection error: ${String(e)}`,
          isStreaming: false,
          status: null,
        }
        return next
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, isLoading, workspace.id])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const industry = workspace.industry ?? "your industry"

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          /* Welcome state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-16">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
              <Bot size={26} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Your {industry} advisor
            </h2>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8">
              Ask me anything about your business data or get expert strategic advice for {industry}.
              I combine your actual numbers with deep industry knowledge.
            </p>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
              {SUGGESTED.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 px-4 py-3 rounded-xl transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {datasets.length === 0 && (
              <p className="mt-6 text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                No data uploaded yet — I can still answer industry questions, but upload a dataset for data-specific insights.
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-4">
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <RotateCcw size={11} />
            New conversation
          </button>
        )}
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            placeholder={`Ask about your data or get ${industry} advice…`}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 disabled:opacity-50 max-h-36 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
