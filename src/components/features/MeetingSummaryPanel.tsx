import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { FileText, Radio } from 'lucide-react';
import { AiSuggestedBadge } from '../ui/OriginBadge';
import { getAuthHeaders, getWorkspaceHeaders } from '../../lib/api';

interface Workspace {
  id: string;
  name: string;
}

interface MeetingSummaryVersion {
  id: string;
  generatedAt: string;
  summary: string;
  sourceChunkCount: number;
  status: 'ai-generated' | 'fallback';
  actionItemIds?: string[];
}

interface MeetingTranscript {
  id: string;
  workspaceId: string;
  meetingId: string;
  chunks: Array<{ speaker: string; text: string; timestamp: string }>;
  startedAt: string;
  endedAt: string | null;
  summaries: MeetingSummaryVersion[];
}

export function MeetingSummaryPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const activeTranscript = useMemo(() => transcripts.find((item) => !item.endedAt) || transcripts[0], [transcripts]);
  const latestSummary = activeTranscript?.summaries.at(-1);

  const loadTranscripts = (workspaceId: string) => {
    fetch(`/api/workspaces/${workspaceId}/meeting-transcripts`, { headers: getWorkspaceHeaders(workspaceId) })
      .then((response) => response.json())
      .then((data) => setTranscripts(data.transcripts || []))
      .catch(() => setTranscripts([]));
  };

  useEffect(() => {
    fetch('/api/workspaces', { headers: getAuthHeaders() })
      .then((response) => response.json())
      .then((items: Workspace[]) => {
        const selected = items[0] || null;
        setWorkspace(selected);
        if (selected) loadTranscripts(selected.id);
      });
  }, []);

  useEffect(() => {
    if (!workspace?.id) return;
    const socket = io('/', { query: { workspaceId: workspace.id } });
    socketRef.current = socket;
    const refresh = () => loadTranscripts(workspace.id);
    socket.on('meeting:chunk', refresh);
    socket.on('meeting:summary', refresh);
    return () => {
      socket.disconnect();
    };
  }, [workspace?.id]);

  return (
    <div className={`rounded-2xl border p-5 text-sm text-white/75 ${activeTranscript && !activeTranscript.endedAt ? 'border-rose-300/30 bg-rose-950/15' : 'border-blue-300/15 bg-blue-950/10'}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-300" />
        <span className="font-semibold text-white/85">Meeting Summary</span>
        </div>
        {latestSummary?.status === 'ai-generated' && <AiSuggestedBadge />}
      </div>
      {!activeTranscript ? (
        <p className="text-xs text-white/45">No transcript webhook has arrived yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-white/45">
            <Link to={`/meetings/${activeTranscript.meetingId}`} className="truncate text-blue-200 hover:text-white">{activeTranscript.meetingId}</Link>
            <span className={`inline-flex items-center gap-1 font-semibold ${activeTranscript.endedAt ? 'text-emerald-300' : 'text-rose-200'}`}>{!activeTranscript.endedAt && <Radio className="h-3 w-3 animate-pulse" />}{activeTranscript.endedAt ? 'Final' : 'Live'}</span>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-white/75">
            {latestSummary?.summary || `${activeTranscript.chunks.length} transcript chunk(s) received. Waiting for summary interval.`}
          </p>
          {latestSummary && (
            <div className="text-[11px] text-white/40">
              Summary as of {new Date(latestSummary.generatedAt).toLocaleTimeString()} · {latestSummary.status === 'fallback' ? 'fallback' : 'AI-assisted suggestion'}
            </div>
          )}
          {latestSummary?.actionItemIds && latestSummary.actionItemIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {latestSummary.actionItemIds.map((id) => <Link key={id} to={`/action-items#${id}`} className="text-[11px] text-blue-200 underline decoration-blue-300/30 underline-offset-2 hover:text-white">Open action item</Link>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
