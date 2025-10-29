"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, Brain, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time?: string;
};

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  async function sendMessage() {
    const content = text.trim();
    if (!content) return;
    const userMsg: Msg = {
      id: String(Date.now()) + "-u",
      role: "user",
      text: content,
      time: now(),
    };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setPending(true);

    try {
      const res = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error || `Server returned ${res.status}`);
        const errMsg: Msg = {
          id: String(Date.now()) + "-e",
          role: "assistant",
          text: "(error)",
          time: now(),
        };
        setMessages((m) => [...m, errMsg]);
        return;
      }

      setErrorMsg(null);
      const replyText = json.output || json.error || "(no response)";
      const botMsg: Msg = {
        id: String(Date.now()) + "-b",
        role: "assistant",
        text: replyText,
        time: now(),
      };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error("chat send error:", err);
      const errMsg: Msg = {
        id: String(Date.now()) + "-e",
        role: "assistant",
        text: "Chat error",
        time: now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 top-16 flex flex-col h-screen">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chat with Memora
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Ask me anything about your memories. I can help you search,
              organize, and recall information.
            </p>
            <div className="mt-6 grid gap-2 w-full max-w-sm">
              {[
                "What did I learn last week?",
                "Show my work memories",
                "Find ideas about design",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setText(suggestion)}
                  className="text-sm text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Sparkles className="w-4 h-4 inline mr-2 text-orange-600" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] ${
                m.role === "user"
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm"
                  : "bg-white border border-gray-200 rounded-2xl rounded-tl-sm"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Memora
                  </span>
                </div>
              )}
              <div className="px-4 py-3">
                <div
                  className={`whitespace-pre-wrap text-sm leading-relaxed ${
                    m.role === "user" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {m.text}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    m.role === "user" ? "text-orange-100" : "text-gray-400"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  Memora is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-4">
        <div className="max-w-3xl mx-auto">
          {errorMsg && (
            <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            </div>
          )}
          <div className="bg-white border border-gray-300 rounded-3xl shadow-lg p-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about your memories..."
                className="flex-1 px-3 py-2 outline-none resize-none text-[15px] max-h-32 overflow-y-auto bg-transparent"
                rows={1}
                disabled={pending}
              />
              <Button
                onClick={() => void sendMessage()}
                disabled={pending || !text.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white h-9 w-9 rounded-xl flex-shrink-0 p-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
