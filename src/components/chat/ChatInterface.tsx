import { GlassPanel } from '../ui/GlassPanel';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useAuth } from '../../contexts/AuthContext';
import { GlassButton } from '../ui/GlassButton';
import { CoWorkLogo } from '../ui/CoWorkLogo';

export function ChatInterface() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();

  if (!isAuthenticated) {
    return (
      <GlassPanel className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-xs flex flex-col items-center">
          <div className="mb-4">
            <CoWorkLogo size="xl" layout="stacked" />
          </div>
          <p className="text-sm font-medium tracking-wide text-neutral-400 mb-6">
            Collaboration Workspace
          </p>
          <GlassButton
            variant="primary"
            size="lg"
            onClick={login}
            isLoading={authLoading}
            className="w-full font-semibold"
          >
            Sign in
          </GlassButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CoWorkLogo size="sm" variant="icon" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Co-Work AI
            </h1>
            <p className="text-xs text-white/40">
              Proactive Assistant & Chief of Staff
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList />

      {/* Input Area */}
      <InputArea />
    </GlassPanel>
  );
}

export default ChatInterface;
