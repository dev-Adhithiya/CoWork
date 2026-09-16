import { FormEvent, useEffect, useState } from 'react';
import { Check, Clock, MessageCircle, Send, X, Video, ExternalLink } from 'lucide-react';
import { getAuthHeaders, getWorkspaceHeaders } from '../../lib/api';

interface Workspace { id: string; name: string }
interface CandidateSlot { start: string; end: string; insideWorkingHoursCount: number; totalOffHoursMinutes: number }
interface MeetingRequest { id: string; recipient: string; reason: string; durationMinutes: number; proposedStart: string; status: 'pending' | 'accepted' | 'rejected'; comment: string; meet_link?: string }

const headersFor = getWorkspaceHeaders;

export function SchedulingPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(30);
  const [timezone, setTimezone] = useState('UTC');
  const [suggestions, setSuggestions] = useState<CandidateSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CandidateSlot | null>(null);
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  const loadRequests = (workspaceId: string) => fetch(`/api/workspaces/${workspaceId}/meeting-requests`, { headers: headersFor(workspaceId) }).then((response) => response.json()).then((data) => setRequests(data.requests || [])).catch(() => setStatus('Could not load meeting requests.'));

  useEffect(() => {
    fetch('/api/workspaces', { headers: getAuthHeaders() }).then((response) => response.json()).then((items: Workspace[]) => {
      const selected = items[0] || null;
      setWorkspace(selected);
      if (selected) loadRequests(selected.id);
    }).catch(() => setStatus('Could not load workspace.'));
  }, []);

  const findTime = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspace || !recipient.trim() || !reason.trim()) { setStatus('Add who you want to meet and why.'); return; }
    const headers = headersFor(workspace.id);
    await fetch('/api/users/me/timezone', { method: 'PATCH', headers, body: JSON.stringify({ timezone }) });
    const response = await fetch(`/api/workspaces/${workspace.id}/schedule/suggestions`, { method: 'POST', headers, body: JSON.stringify({ durationMinutes: duration, participantIds: ['user_cowork_1'], days: 5 }) });
    const data = await response.json();
    setSuggestions(data.suggestions || []);
    setSelectedSlot(data.suggestions?.[0] || null);
    setStatus(data.suggestions?.length ? 'Choose a proposed time, then send the request.' : 'No possible slots found.');
  };

  const sendRequest = async () => {
    if (!workspace || !selectedSlot) return;
    const response = await fetch(`/api/workspaces/${workspace.id}/meeting-requests`, { method: 'POST', headers: headersFor(workspace.id), body: JSON.stringify({ recipient, reason, durationMinutes: duration, proposedStart: selectedSlot.start, proposedEnd: selectedSlot.end }) });
    if (!response.ok) { setStatus('Could not send meeting request.'); return; }
    setStatus(`Request sent to ${recipient}.`);
    setSuggestions([]);
    setSelectedSlot(null);
    loadRequests(workspace.id);
  };

  const updateRequest = async (request: MeetingRequest, nextStatus: MeetingRequest['status']) => {
    if (!workspace) return;
    await fetch(`/api/meeting-requests/${request.id}`, { method: 'PATCH', headers: headersFor(workspace.id), body: JSON.stringify({ status: nextStatus, comment: comments[request.id] ?? request.comment }) });
    loadRequests(workspace.id);
  };

  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
    <section className="rounded-2xl border border-cyan-300/15 bg-cyan-950/10 p-5 text-sm text-white/75">
      <div className="mb-5 flex items-center gap-2"><Clock className="h-5 w-5 text-cyan-300" /><div><h2 className="font-semibold text-white">Request a meeting</h2><p className="text-xs text-white/40">Find a time, explain the reason, and send it for approval.</p></div></div>
      <form onSubmit={findTime} className="space-y-3">
        <label className="grid gap-1 text-xs text-white/55">Person to meet<input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="username or email" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35" /></label>
        <label className="grid gap-1 text-xs text-white/55">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why should this person meet with you?" rows={3} className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs text-white/55">Timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></label><label className="grid gap-1 text-xs text-white/55">Duration<input value={duration} onChange={(event) => setDuration(Number(event.target.value))} type="number" min={15} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></label></div>
        <button className="w-full rounded-lg bg-cyan-500/20 px-3 py-2.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/30"><Clock className="mr-2 inline h-4 w-4" />Find available times</button>
      </form>
      {status && <p className="mt-3 text-xs text-white/50">{status}</p>}
      {suggestions.length > 0 && <div className="mt-5 space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-white/40">Proposed times</p>{suggestions.slice(0, 4).map((slot) => <button type="button" key={slot.start} onClick={() => setSelectedSlot(slot)} className={`w-full rounded-xl border p-3 text-left ${selectedSlot?.start === slot.start ? 'border-cyan-300/50 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><div className="text-xs text-white/90">{new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleTimeString()}</div><div className="mt-1 text-[11px] text-white/40">{slot.insideWorkingHoursCount} in hours · {slot.totalOffHoursMinutes} off-hours minutes</div></button>)}</div>}
      {selectedSlot && <button type="button" onClick={sendRequest} className="mt-4 w-full rounded-lg bg-blue-500/25 px-3 py-2.5 text-xs font-medium text-blue-100 hover:bg-blue-500/35"><Send className="mr-2 inline h-4 w-4" />Send request to {recipient}</button>}
    </section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="mb-4 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-violet-300" /><h2 className="font-semibold text-white">Meeting requests</h2></div><div className="space-y-3">{requests.length === 0 ? <p className="text-xs text-white/40">Requests you send will appear here.</p> : requests.map((request) => <article key={request.id} className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-white/85">{request.recipient}</p><p className="mt-1 text-xs text-white/50">{request.reason}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${request.status === 'accepted' ? 'bg-emerald-400/15 text-emerald-200' : request.status === 'rejected' ? 'bg-red-400/15 text-red-200' : 'bg-amber-400/15 text-amber-200'}`}>{request.status}</span></div><p className="mt-3 text-[11px] text-white/45">{new Date(request.proposedStart).toLocaleString()} · {request.durationMinutes} min</p>{request.meet_link && <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs"><div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px]"><Video className="h-3.5 w-3.5 shrink-0" /><span className="truncate max-w-[170px]">{request.meet_link}</span></div><a href={request.meet_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/40">Join Meet<ExternalLink className="h-2.5 w-2.5" /></a></div>}<textarea value={comments[request.id] ?? request.comment} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Add a comment" rows={2} className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white placeholder-white/30" />{request.status === 'pending' && <div className="mt-2 flex gap-2"><button onClick={() => updateRequest(request, 'accepted')} className="flex-1 rounded-lg bg-emerald-400/15 px-2 py-2 text-xs text-emerald-100"><Check className="mr-1 inline h-3.5 w-3.5" />Accept</button><button onClick={() => updateRequest(request, 'rejected')} className="flex-1 rounded-lg bg-red-400/10 px-2 py-2 text-xs text-red-100"><X className="mr-1 inline h-3.5 w-3.5" />Reject</button></div>}</article>)}</div></section>
  </div>;
}
