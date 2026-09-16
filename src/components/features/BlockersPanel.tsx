import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AiSuggestedBadge } from '../ui/OriginBadge';
import { getAuthHeaders, getWorkspaceHeaders } from '../../lib/api';

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
    fetch(`/api/workspaces/${workspaceId}/blockers`, { headers: getWorkspaceHeaders(workspaceId) })
      .then((response) => response.json())
      .then((data) => setBlockers(data.blockers || []));
  };

  useEffect(() => {
    fetch('/api/workspaces', { headers: getAuthHeaders() }).then((response) => response.json()).then((items: Workspace[]) => {
      const selected = items[0] || null;
      setWorkspace(selected);
      if (selected) load(selected.id);
    });
  }, []);

  const resolve = async (id: string) => {
    if (!workspace) return;
    await fetch(`/api/blockers/${id}/resolve`, { method: 'PATCH', headers: getWorkspaceHeaders(workspace.id) });
    load(workspace.id);
  };

  return (
    <div className="h-full rounded-2xl border border-amber-300/15 bg-amber-950/10 p-5 text-sm text-white/75">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        <span className="font-semibold text-white/85">Blockers</span>
        </div>
        <AiSuggestedBadge />
      </div>
      <div className="space-y-2">
        {blockers.length === 0 ? <p className="text-xs text-white/45">No active inferred blockers.</p> : blockers.map((blocker) => (
          <div key={blocker.id} className={`rounded-xl border p-3 ${blocker.severity === 'blocking' ? 'border-red-300/35 bg-red-500/10' : blocker.severity === 'at-risk' ? 'border-amber-300/30 bg-amber-500/10' : 'border-sky-300/20 bg-sky-500/10'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${blocker.severity === 'blocking' ? 'text-red-200' : blocker.severity === 'at-risk' ? 'text-amber-200' : 'text-sky-200'}`}>{blocker.severity}</span>
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
