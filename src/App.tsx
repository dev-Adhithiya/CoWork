import { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MeshGradient } from './components/background/MeshGradient';
import { ChatInterface } from './components/chat/ChatInterface';
import { LoginPage } from './components/auth/LoginPage';
import { TeamChatPanel } from './components/features/TeamChatPanel';
import { PriorityPanel } from './components/features/PriorityPanel';
import { BriefingPanel } from './components/features/BriefingPanel';
import { CalendarPanel } from './components/features/CalendarPanel';
import { TasksPanel } from './components/features/TasksPanel';
import { NotesPanel } from './components/features/NotesPanel';
import { MeetingSummaryPanel } from './components/features/MeetingSummaryPanel';
import { StandupPanel } from './components/features/StandupPanel';
import { Sparkles, Users, LogOut } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [activeChat, setActiveChat] = useState<'ai' | 'team'>('ai');

  if (isLoading) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center">
        <MeshGradient />
        <div className="relative z-10 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <MeshGradient />
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Animated background */}
      <MeshGradient />

      {/* Main layout with subtle fade-in animation when workspace first loads */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex h-full p-4 gap-4"
      >
        <div className="flex-1 flex gap-4 w-full max-w-full">
          {/* Middle panel: MS Teams style Chat Interface */}
          <div className="flex-1 min-w-[500px] flex bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
            {/* Contacts/Chat List Column */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-black/20">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold text-white/90">Chats</h2>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button
                  onClick={() => setActiveChat('ai')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeChat === 'ai'
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activeChat === 'ai' ? 'bg-blue-500/30' : 'bg-white/10'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">Co-Work AI</div>
                    <div className="text-xs opacity-70 truncate">Your Chief of Staff</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveChat('team')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeChat === 'team'
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activeChat === 'team' ? 'bg-blue-500/30' : 'bg-white/10'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">Team General</div>
                    <div className="text-xs opacity-70 truncate">Staff & Co-workers</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Chat Content Column */}
            <div className="flex-1 flex flex-col min-w-0">
              {activeChat === 'ai' ? (
                <ChatInterface />
              ) : (
                <TeamChatPanel />
              )}
            </div>
          </div>
          
          {/* Right panel: Utilities (Tasks, Notes, Calendar, Priority, etc.) */}
          <div className="w-[380px] flex flex-col gap-4 overflow-y-auto flex-shrink-0">
            <PriorityPanel />
            <MeetingSummaryPanel />
            <StandupPanel />
            <BriefingPanel />
            <CalendarPanel />
            <TasksPanel />
            <NotesPanel />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      {/* Provider order: auth first so chat and panels can call authenticated APIs. */}
      <AuthProvider>
        <ChatProvider>
          <VoiceProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </VoiceProvider>
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
