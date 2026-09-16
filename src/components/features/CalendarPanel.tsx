import { useEffect, useState } from 'react';
import { Calendar, Video, Clock, Users, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { calendarAPI, type CalendarEvent } from '../../lib/api';

export function CalendarPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickText, setQuickText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await calendarAPI.listEvents(20);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await calendarAPI.quickAdd(quickText.trim());
      setQuickText('');
      await fetchEvents();
    } catch (err) {
      console.error('Failed to quick-add event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Google Calendar & Meet</h2>
            <p className="text-[11px] text-white/40">Synced events across workspace & integrations</p>
          </div>
        </div>

        <button
          onClick={fetchEvents}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
          title="Refresh calendar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="border-b border-white/10 p-3 bg-white/[0.01]">
        <div className="flex gap-2">
          <input
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Quick schedule with Meet (e.g. 1:1 sync tomorrow 4pm)..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !quickText.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-500/25 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/40 transition disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </form>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && events.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40">Loading calendar events...</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40">No events scheduled. Use chat or quick add to schedule one.</div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 hover:bg-white/[0.05] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-white/90">{evt.summary}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Clock className="h-3 w-3" />
                      {new Date(evt.start).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    {evt.attendees && evt.attendees.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3 text-white/40" />
                        {evt.attendees.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {evt.meet_link ? (
                  <a
                    href={evt.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/35 transition"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join Meet
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                ) : (
                  <span className="rounded px-2 py-0.5 text-[10px] text-white/35 bg-white/5">
                    {evt.location || 'Local'}
                  </span>
                )}
              </div>

              {evt.description && (
                <p className="mt-2 text-[11px] text-white/40 line-clamp-2 italic">
                  {evt.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
