import { createContext, ReactNode, useContext, useState } from 'react';
import { chatAPI, type ChatMessage } from '../lib/api';

const welcome: ChatMessage = { role: 'assistant', content: 'Hello! I am Co-Work. How can I help your workspace today?' };

interface ChatContextValue {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  activeTool: string | null;
  emailDraft: { to: string; subject: string; body: string; originalMessageId?: string } | null;
  setActiveTool: (tool: string | null) => void;
  setEmailDraft: (draft: { to: string; subject: string; body: string; originalMessageId?: string } | null) => void;
  setIsEmailModeActive: (active: boolean) => void;
  sendMessage: (message: string, images?: File[]) => Promise<void>;
  stopMessage: () => void;
  createNewSession: () => void;
  loadSession: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<{ to: string; subject: string; body: string; originalMessageId?: string } | null>(null);

  const sendMessage = async (message: string, images?: File[]) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    try {
      const response = await chatAPI.sendMessage(message, sessionId || undefined, images);
      setSessionId(response.session_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: error instanceof Error ? error.message : 'Message failed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    const data = await chatAPI.getSessionMessages(id);
    setSessionId(id);
    setMessages(data.messages || [welcome]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        isLoading,
        activeTool,
        emailDraft,
        setActiveTool,
        setEmailDraft,
        setIsEmailModeActive: () => {},
        sendMessage,
        stopMessage: () => setIsLoading(false),
        createNewSession: () => {
          setSessionId(null);
          setMessages([welcome]);
        },
        loadSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
