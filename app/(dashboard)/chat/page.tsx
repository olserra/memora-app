import ChatPanel from "@/components/dashboard/ChatPanel";

export default function ChatPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Chat</h1>
      <ChatPanel />
    </section>
  );
}
