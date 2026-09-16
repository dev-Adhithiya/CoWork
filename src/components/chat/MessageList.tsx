import { useChat } from '../../contexts/ChatContext';

export function MessageList() {
  const { messages } = useChat();
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'bg-blue-500/75 text-white' : 'bg-white/10 text-white/90'}`}>
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
