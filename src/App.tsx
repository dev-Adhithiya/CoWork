import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MeshGradient } from './components/background/MeshGradient';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { ChatPage } from './pages/ChatPage';
import {
  ActionItemsPage,
  BlockersPage,
  MeetingsPage,
  RoomsPage,
  SchedulingPage,
  StandupsPage,
} from './pages/WorkspacePages';

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/chat/ai" replace />} />
            <Route path="/chat/:channelId" element={<ChatPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/meetings/:meetingId" element={<MeetingsPage />} />
            <Route path="/standups" element={<StandupsPage />} />
            <Route path="/blockers" element={<BlockersPage />} />
            <Route path="/action-items" element={<ActionItemsPage />} />
            <Route path="/scheduling" element={<SchedulingPage />} />
            <Route path="*" element={<Navigate to="/chat/ai" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
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
