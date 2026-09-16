import { useState } from 'react';
import { MessageSquare, Sparkles, Users } from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';
import { TeamChatPanel } from '../components/features/TeamChatPanel';

export function ChatPage() {
  const [activeChat, setActiveChat] = useState<'ai' | 'team'>('ai');

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button onClick={() => setActiveChat('ai')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${activeChat === 'ai' ? 'bg-blue-500/20 text-blue-100' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
          <Sparkles className="h-3.5 w-3.5" /> Co-Work AI
        </button>
        <button onClick={() => setActiveChat('team')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${activeChat === 'team' ? 'bg-blue-500/20 text-blue-100' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
          <Users className="h-3.5 w-3.5" /> Team chat
        </button>
        <div className="ml-auto hidden items-center gap-2 px-3 text-[11px] text-white/35 sm:flex">
          <MessageSquare className="h-3.5 w-3.5" /> Channel conversation
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeChat === 'ai' ? <ChatInterface /> : <TeamChatPanel />}
      </div>
    </section>
  );
}

export default ChatPage;
