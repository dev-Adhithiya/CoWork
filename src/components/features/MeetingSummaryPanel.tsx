import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { FileText } from 'lucide-react';

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
    fetch(`/api/workspaces/${workspaceId}/meeting-transcripts`, { headers: { 'x-workspace-id': workspaceId } })
      .then((response) => response.json())
      .then((data) => setTranscripts(data.transcripts || []))
      .catch(() => setTranscripts([]));
  };

  useEffect(() => {
    fetch('/api/workspaces')
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
    <div className="glass-subtle p-4 text-sm text-white/75">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-blue-300" />
        <span className="font-semibold text-white/85">Meeting Summary</span>
      </div>
      {!activeTranscript ? (
        <p className="text-xs text-white/45">No transcript webhook has arrived yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-white/45">
            <span className="truncate">{activeTranscript.meetingId}</span>
            <span className={activeTranscript.endedAt ? 'text-emerald-300' : 'text-blue-300'}>{activeTranscript.endedAt ? 'Final' : 'Live'}</span>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-white/75">
            {latestSummary?.summary || `${activeTranscript.chunks.length} transcript chunk(s) received. Waiting for summary interval.`}
          </p>
          {latestSummary && (
            <div className="text-[11px] text-white/40">
              Summary as of {new Date(latestSummary.generatedAt).toLocaleTimeString()} · {latestSummary.status === 'fallback' ? 'fallback' : 'AI-assisted suggestion'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
