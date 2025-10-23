"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [pending, setPending] = useState(false);

  async function send() {
    if (!input) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const json = await res.json();
      const reply = json.output || json.error || "(no response)";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "Chat error" }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Chat with your data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto border rounded p-3 bg-white">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Ask something about your memories.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block px-3 py-1 rounded ${
                    m.role === "user" ? "bg-orange-100" : "bg-gray-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
            />
            <Button onClick={send} disabled={pending || !input}>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
