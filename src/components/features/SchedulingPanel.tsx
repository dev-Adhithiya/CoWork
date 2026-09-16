import { FormEvent, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Workspace { id: string; name: string }
interface CandidateSlot {
  start: string;
  end: string;
  insideWorkingHoursCount: number;
  totalOffHoursMinutes: number;
  localTimes: Array<{ userId: string; timezone: string; start: string; end: string; insideWorkingHours: boolean }>;
}

export function SchedulingPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [duration, setDuration] = useState(30);
  const [timezone, setTimezone] = useState('UTC');
  const [suggestions, setSuggestions] = useState<CandidateSlot[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/workspaces').then((response) => response.json()).then((items: Workspace[]) => setWorkspace(items[0] || null));
  }, []);

  const findTime = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspace) return;
    await fetch('/api/users/me/timezone', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspace.id },
      body: JSON.stringify({ timezone }),
    });
    const response = await fetch(`/api/workspaces/${workspace.id}/schedule/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspace.id },
      body: JSON.stringify({ durationMinutes: duration, participantIds: ['user_cowork_1'], days: 5 }),
    });
    const data = await response.json();
    setSuggestions(data.suggestions || []);
    setStatus(data.suggestions?.length ? '' : 'No possible slots found.');
  };

  return (
    <div className="glass-subtle p-4 text-sm text-white/75">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-cyan-300" />
        <span className="font-semibold text-white/85">Find a Time</span>
      </div>
      <form onSubmit={findTime} className="grid grid-cols-[1fr_80px] gap-2">
        <input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white" placeholder="IANA timezone" />
        <input value={duration} onChange={(event) => setDuration(Number(event.target.value))} type="number" min={15} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white" />
        <button className="col-span-2 rounded-lg bg-cyan-500/20 text-cyan-100 px-3 py-2 text-xs">Suggest slots</button>
      </form>
      {status && <p className="mt-2 text-xs text-white/45">{status}</p>}
      <div className="mt-3 space-y-2">
        {suggestions.slice(0, 3).map((slot) => (
          <div key={slot.start} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-xs text-white/85">{new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleTimeString()}</div>
            <div className="text-[11px] text-white/40">{slot.insideWorkingHoursCount} in hours · {slot.totalOffHoursMinutes} off-hours min</div>
            {slot.localTimes.map((local) => <div key={local.userId} className="text-[11px] text-white/50">{local.userId}: {local.start} ({local.timezone})</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}
