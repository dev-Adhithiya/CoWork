import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Workspace { id: string; name: string }
interface Blocker {
  id: string;
  description: string;
  mentionedBy: string;
  severity: 'blocking' | 'at-risk' | 'fyi' | 'unclassified';
  relatedTo: string | null;
  status: 'active' | 'resolved';
}

export function BlockersPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);

  const load = (workspaceId: string) => {
    fetch(`/api/workspaces/${workspaceId}/blockers`, { headers: { 'x-workspace-id': workspaceId } })
      .then((response) => response.json())
      .then((data) => setBlockers(data.blockers || []));
  };

  useEffect(() => {
    fetch('/api/workspaces').then((response) => response.json()).then((items: Workspace[]) => {
      const selected = items[0] || null;
      setWorkspace(selected);
      if (selected) load(selected.id);
    });
  }, []);

  const resolve = async (id: string) => {
    if (!workspace) return;
    await fetch(`/api/blockers/${id}/resolve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspace.id } });
    load(workspace.id);
  };

  return (
    <div className="glass-subtle p-4 text-sm text-white/75">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        <span className="font-semibold text-white/85">Blockers</span>
        <span className="text-[11px] text-white/35">inferred</span>
      </div>
      <div className="space-y-2">
        {blockers.length === 0 ? <p className="text-xs text-white/45">No active inferred blockers.</p> : blockers.map((blocker) => (
          <div key={blocker.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase text-white/40">{blocker.severity}</span>
              <button onClick={() => resolve(blocker.id)} className="text-emerald-200 hover:text-emerald-100" title="Mark resolved">
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mt-1">{blocker.description}</p>
            <div className="text-[11px] text-white/40 mt-1">Mentioned by {blocker.mentionedBy}{blocker.relatedTo ? ` · ${blocker.relatedTo}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
