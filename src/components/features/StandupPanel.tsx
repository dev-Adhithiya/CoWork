import { FormEvent, useEffect, useState } from 'react';
import { ClipboardList, Wand2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
}

interface StandupDigest {
  id: string;
  date: string;
  mergedSummary: string;
  generatedAt: string;
  status: 'ai-generated' | 'fallback';
}

export function StandupPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [content, setContent] = useState('');
  const [digest, setDigest] = useState<StandupDigest | null>(null);
  const [status, setStatus] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const headers: Record<string, string> = workspace ? { 'Content-Type': 'application/json', 'x-workspace-id': workspace.id } : { 'Content-Type': 'application/json' };

  const loadDigest = (workspaceId: string) => {
    fetch(`/api/workspaces/${workspaceId}/standup-digests?date=${today}`, { headers: { 'x-workspace-id': workspaceId } })
      .then((response) => response.json())
      .then((data) => setDigest(data.digests?.[0] || null))
      .catch(() => setDigest(null));
  };

  useEffect(() => {
    fetch('/api/workspaces')
      .then((response) => response.json())
      .then((items: Workspace[]) => {
        const selected = items[0] || null;
        setWorkspace(selected);
        if (selected) loadDigest(selected.id);
      });
  }, []);

  const submitEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspace || !content.trim()) return;
    const response = await fetch(`/api/workspaces/${workspace.id}/standup-entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, content }),
    });
    setStatus(response.ok ? 'Standup saved.' : 'Could not save standup.');
    if (response.ok) setContent('');
  };

  const generateDigest = async () => {
    if (!workspace) return;
    const response = await fetch(`/api/workspaces/${workspace.id}/standup-digests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today }),
    });
    if (response.ok) {
      setDigest(await response.json());
      setStatus('Digest generated.');
    } else {
      setStatus('Add at least one standup entry first.');
    }
  };

  return (
    <div className="glass-subtle p-4 text-sm text-white/75">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-emerald-300" />
        <span className="font-semibold text-white/85">Standup</span>
      </div>
      <form onSubmit={submitEntry} className="space-y-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Yesterday I..., today I'll..., blocked on..."
          className="w-full min-h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/35 focus:outline-none resize-none"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-emerald-500/20 text-emerald-100 px-3 py-2 text-xs disabled:opacity-40" disabled={!content.trim()}>
            Submit
          </button>
          <button type="button" onClick={generateDigest} className="w-10 rounded-lg bg-white/10 text-white/75 flex items-center justify-center" title="Generate digest">
            <Wand2 className="w-4 h-4" />
          </button>
        </div>
      </form>
      {status && <div className="mt-2 text-[11px] text-white/45">{status}</div>}
      {digest && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-1 text-[11px] text-white/40">
            {digest.status === 'ai-generated' ? 'AI-assisted suggested digest' : 'Fallback digest'} · {new Date(digest.generatedAt).toLocaleTimeString()}
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{digest.mergedSummary}</p>
        </div>
      )}
    </div>
  );
}
