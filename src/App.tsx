import { useState } from 'react';
import { motion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MeshGradient } from './components/background/MeshGradient';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatInterface } from './components/chat/ChatInterface';
import { PriorityPanel } from './components/features/PriorityPanel';
import { BriefingPanel } from './components/features/BriefingPanel';
import { EmailDraftConsole } from './components/features/EmailDraftConsole';
import { SearchPanel } from './components/features/SearchPanel';
import { LoginPage } from './components/auth/LoginPage';

import { CalendarPanel } from './components/features/CalendarPanel';
import { TasksPanel } from './components/features/TasksPanel';
import { NotesPanel } from './components/features/NotesPanel';
import { GlassPanel } from './components/ui/GlassPanel';
import { PanelRight, PanelRightClose } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  // Controls whether the right utility panel stack is fully shown or collapsed.
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isSearchOpen] = useState(false);
  const { isEmailModeActive } = useChat();

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
        {/* Sidebar */}
        <Sidebar />

        {/* Content area */}
        <div className="flex-1 flex gap-4 w-full max-w-full">
          <div className="flex-1 min-w-[400px] flex">
            <ChatInterface />
          </div>
          
          {isEmailModeActive ? (
            <div className="flex-1 min-w-[400px] flex">
              <EmailDraftConsole />
            </div>
          ) : (
            /* Feature panels (right side) - Collapsible */
            isRightSidebarCollapsed ? (
              // Compact mode: keep a single action to restore full utilities panel.
              <GlassPanel className="w-12 flex flex-col items-center py-4 flex-shrink-0">
                <button
                  onClick={() => setIsRightSidebarCollapsed(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Expand panel"
                >
                  <PanelRight className="w-5 h-5 text-white/60" />
                </button>
              </GlassPanel>
            ) : (
              // Expanded mode: show briefing + communication/planning feature panels.
              <div className="w-96 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
                {/* Collapse button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsRightSidebarCollapsed(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Collapse panel"
                  >
                    <PanelRightClose className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Elastic Search Panel — shown when toggled from sidebar */}
                {isSearchOpen && <SearchPanel />}

                <BriefingPanel />
                <CalendarPanel />
                <TasksPanel />
                <NotesPanel />
                <PriorityPanel />
              </div>
            )
          )}
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

