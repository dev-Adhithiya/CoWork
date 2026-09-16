import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';

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
    fetch(`/api/workspaces/${workspaceId}/action-items`, { headers: { 'x-workspace-id': workspaceId } })
      .then((response) => response.json())
      .then((data) => setItems(data.actionItems || []));
  };

  useEffect(() => {
    fetch('/api/workspaces').then((response) => response.json()).then((workspaces: Workspace[]) => {
      const selected = workspaces[0] || null;
      setWorkspace(selected);
      if (selected) load(selected.id);
    });
  }, []);

  const confirm = async (id: string) => {
    if (!workspace) return;
    await fetch(`/api/action-items/${id}/confirm`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspace.id } });
    load(workspace.id);
  };

  return (
    <div className="glass-subtle p-4 text-sm text-white/75">
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="w-4 h-4 text-purple-300" />
        <span className="font-semibold text-white/85">Action Items</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-xs text-white/45">No suggested action items yet.</p> : items.map((item) => (
          <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[11px] text-white/40">{item.status} · {item.sourceType}</div>
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
