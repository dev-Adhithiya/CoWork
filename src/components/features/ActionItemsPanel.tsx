import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { AiSuggestedBadge, ConfirmedBadge } from '../ui/OriginBadge';
import { getAuthHeaders, getWorkspaceHeaders } from '../../lib/api';

interface Workspace { id: string; name: string }
interface ActionItem {
  id: string;
  description: string;
  suggestedOwnerId: string | null;
  confirmedOwnerId: string | null;
  sourceType: 'meeting' | 'standup';
  status: 'suggested' | 'confirmed' | 'done';
}

export function ActionItemsPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);

  const load = (workspaceId: string) => {
    fetch(`/api/workspaces/${workspaceId}/action-items`, { headers: getWorkspaceHeaders(workspaceId) })
      .then((response) => response.json())
      .then((data) => setItems(data.actionItems || []));
  };

  useEffect(() => {
    fetch('/api/workspaces', { headers: getAuthHeaders() }).then((response) => response.json()).then((workspaces: Workspace[]) => {
      const selected = workspaces[0] || null;
      setWorkspace(selected);
      if (selected) load(selected.id);
    });
  }, []);

  const confirm = async (id: string) => {
    if (!workspace) return;
    await fetch(`/api/action-items/${id}/confirm`, { method: 'PATCH', headers: getWorkspaceHeaders(workspace.id) });
    load(workspace.id);
  };

  return (
    <div className="h-full rounded-2xl border border-violet-300/15 bg-violet-950/10 p-5 text-sm text-white/75">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-purple-300" />
        <span className="font-semibold text-white/85">Action Items</span>
        </div>
        <AiSuggestedBadge />
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-xs text-white/45">No suggested action items yet.</p> : items.map((item) => (
          <div id={item.id} key={item.id} className={`rounded-xl p-3 ${item.status === 'suggested' ? 'border border-dashed border-violet-300/30 bg-violet-400/5' : 'border border-emerald-300/20 bg-white/5'}`}>
            <div className="flex items-center justify-between gap-2 text-[11px] text-white/40">
              <span>{item.sourceType}</span>
              {item.status === 'suggested' ? <AiSuggestedBadge /> : <ConfirmedBadge />}
            </div>
            <p className="text-xs mt-1">{item.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/40">Suggested: {item.suggestedOwnerId || 'unassigned'}</span>
              {item.status === 'suggested' && <button onClick={() => confirm(item.id)} className="rounded bg-purple-500/20 px-2 py-1 text-[11px] text-purple-100">Confirm mine</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
