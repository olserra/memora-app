"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    // auto-scroll to bottom on new messages
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
        // surface server-side errors to the user
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
      // log the error for diagnostics and show a friendly message
      // eslint-disable-next-line no-console
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
    <Card className="max-w-3xl mx-auto mt-8 h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          >
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Ask something about your memories.
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
                  className={`max-w-[80%] p-3 rounded-lg break-words ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-4 bg-white">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <div className="flex flex-col gap-3">
              {errorMsg && (
                <div className="text-sm text-red-600">{errorMsg}</div>
              )}
              <div className="flex gap-3">
                <textarea
                  id="chat-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Write a message... (Enter to send, Shift+Enter for newline)"
                  className="flex-1 min-h-[44px] max-h-48 resize-none rounded-md border px-3 py-2 focus:outline-none focus:ring"
                />
                <div className="flex items-end">
                  <Button
                    onClick={() => void sendMessage()}
                    disabled={pending || !text.trim()}
                  >
                    {pending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
