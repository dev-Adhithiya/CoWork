import { Outlet, useLocation } from 'react-router-dom';
import { MeshGradient } from '../background/MeshGradient';
import { Sidebar } from '../sidebar/Sidebar';

const pageContext: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/rooms': { eyebrow: 'Workspace presence', title: 'Rooms', description: 'See where the team is working right now.' },
  '/meetings': { eyebrow: 'Meetings', title: 'Meetings', description: 'Follow live transcripts and meeting outcomes.' },
  '/standups': { eyebrow: 'Team rhythm', title: 'Standups', description: 'Collect today’s updates and review the team digest.' },
  '/blockers': { eyebrow: 'Delivery health', title: 'Blockers', description: 'Surface risks before they slow the team down.' },
  '/action-items': { eyebrow: 'Follow-through', title: 'Action items', description: 'Turn decisions into accountable next steps.' },
  '/scheduling': { eyebrow: 'Workspace utility', title: 'Find a time', description: 'Find a workable meeting slot across schedules.' },
};

function getPageContext(pathname: string) {
  if (pathname.startsWith('/chat/')) {
    return { eyebrow: 'Conversation', title: 'Chat', description: 'Talk with Co-Work AI or your team.' };
  }
  if (pathname.startsWith('/meetings/')) {
    return { eyebrow: 'Meeting detail', title: 'Meeting room', description: 'Review the live transcript and captured outcomes.' };
  }
  return pageContext[pathname] || { eyebrow: 'Workspace', title: 'Co-Work', description: 'Your team workspace and chief of staff.' };
}

export function AppShell() {
  const location = useLocation();
  const context = getPageContext(location.pathname);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MeshGradient />
      <div className="relative z-10 flex h-full gap-4 p-4">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/10 backdrop-blur-md">
          <header className="flex min-h-[76px] items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">{context.eyebrow}</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">{context.title}</h1>
              <p className="mt-1 text-xs text-white/45">{context.description}</p>
            </div>
          </header>
          <div className="h-[calc(100%-76px)] overflow-hidden p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
