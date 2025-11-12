import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatContent } from "@/components/chat-content"

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-52">
        <Header title="Assistant" />
        <main className="flex-1 overflow-auto">
          <ChatContent />
        </main>
      </div>
    </div>
  )
}
