import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import {
  Search,
  StickyNote,
  Mail,
  CheckSquare,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  type: 'note' | 'email' | 'task' | 'event' | string;
  score: number;
  id: string;
  // note fields
  title?: string;
  content?: string;
  tags?: string[];
  // email fields
  subject?: string;
  from_addr?: string;
  snippet?: string;
  body?: string;
  is_unread?: boolean;
  date?: string;
  // task fields
  notes?: string;
  is_completed?: boolean;
  due?: string;
  // event fields
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  // highlights
  highlights?: Record<string, string[]>;
}

interface SearchResponse {
  available: boolean;
  query: string;
  total: number;
  results: SearchResult[];
  message: string;
}

type FilterType = 'all' | 'notes' | 'emails' | 'tasks' | 'events';

// ─── API helper ───────────────────────────────────────────────────────────────

const getApiBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

async function fetchSearch(
  query: string,
  type: FilterType,
  limit: number
): Promise<SearchResponse> {
  const token = localStorage.getItem('access_token');
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (type !== 'all') params.set('type', type);
  const res = await fetch(`${getApiBaseUrl()}/search?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  note: {
    icon: <StickyNote className="w-3.5 h-3.5" />,
    label: 'Note',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  email: {
    icon: <Mail className="w-3.5 h-3.5" />,
    label: 'Email',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  task: {
    icon: <CheckSquare className="w-3.5 h-3.5" />,
    label: 'Task',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  event: {
    icon: <Calendar className="w-3.5 h-3.5" />,
    label: 'Event',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
};

function getTitle(r: SearchResult): string {
  return r.title || r.subject || r.summary || '(Untitled)';
}

function getSnippet(r: SearchResult): string {
  if (r.highlights) {
    const first = Object.values(r.highlights)[0];
    if (first && first[0]) return first[0].replace(/<\/?mark>/g, '');
  }
  return r.snippet || r.content?.slice(0, 120) || r.notes?.slice(0, 120) || r.description?.slice(0, 120) || '';
}

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[result.type] || {
    icon: <Search className="w-3.5 h-3.5" />,
    label: result.type,
    color: 'text-white/60 bg-white/5 border-white/10',
  };
  const title = getTitle(result);
  const snippet = getSnippet(result);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="group rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-3 flex items-start gap-2.5">
        {/* Type badge */}
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0 mt-0.5 ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-white/90 truncate">{title}</p>
            <span className="text-[9px] text-white/25 flex-shrink-0">
              {(result.score * 100).toFixed(0)}% match
            </span>
          </div>
          {snippet && (
            <p className="text-xs text-white/45 mt-0.5 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          )}
          {/* Extra meta */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {result.from_addr && (
              <span className="text-[10px] text-white/30">from: {result.from_addr}</span>
            )}
            {result.due && (
              <span className="text-[10px] text-white/30">due: {new Date(result.due).toLocaleDateString()}</span>
            )}
            {result.start && (
              <span className="text-[10px] text-white/30">{new Date(result.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {result.tags && result.tags.length > 0 && (
              <span className="text-[10px] text-white/30">{result.tags.slice(0, 3).join(', ')}</span>
            )}
            {result.is_unread && (
              <span className="text-[10px] text-blue-400 font-semibold">● Unread</span>
            )}
            {result.is_completed === true && (
              <span className="text-[10px] text-emerald-400 font-medium">✓ Done</span>
            )}
          </div>
        </div>

        <button className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-0.5">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/8"
          >
            <div className="p-3 text-xs text-white/60 space-y-1 bg-black/10">
              {result.content && <p className="leading-relaxed line-clamp-6">{result.content}</p>}
              {result.body && <p className="leading-relaxed line-clamp-6">{result.body}</p>}
              {result.description && <p className="leading-relaxed">{result.description}</p>}
              {result.location && <p>📍 {result.location}</p>}
              <p className="text-white/25 text-[10px] pt-1">ID: {result.id}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main SearchPanel ─────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all',    label: 'All',    icon: <Search className="w-3 h-3" /> },
  { value: 'notes',  label: 'Notes',  icon: <StickyNote className="w-3 h-3" /> },
  { value: 'emails', label: 'Emails', icon: <Mail className="w-3 h-3" /> },
  { value: 'tasks',  label: 'Tasks',  icon: <CheckSquare className="w-3 h-3" /> },
  { value: 'events', label: 'Events', icon: <Calendar className="w-3 h-3" /> },
];

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, f: FilterType) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSearch(q.trim(), f, 20);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setMessage(data.message || '');
      setSearched(true);
    } catch (e: any) {
      setError(e.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v, filter), 300);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    if (query.trim()) doSearch(query, f);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError(null);
    setMessage('');
  };

  return (
    <GlassPanel className="flex flex-col max-h-[550px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90">Workspace Search</h3>
            <p className="text-[10px] text-white/40">Search notes, emails, tasks & calendar</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            id="workspace-search-input"
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query, filter)}
            placeholder="Search notes, emails, tasks, events…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-blue-400/40 focus:bg-white/8 transition-all"
          />
          {(loading || query) && (
            <button
              id="workspace-search-clear-btn"
              onClick={loading ? undefined : handleClear}
              aria-label="Clear search query"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <X className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              id={`search-filter-${opt.value}`}
              onClick={() => handleFilterChange(opt.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                filter === opt.value
                  ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                  : 'bg-white/4 border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {!error && searched && (
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40">{message || `Found ${results.length} result${results.length === 1 ? '' : 's'}`}</p>
            {total > results.length && (
              <span className="text-[10px] text-white/25">showing {results.length} of {total}</span>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {results.map(r => (
            <ResultCard key={r.id} result={r} />
          ))}
        </AnimatePresence>

        {!loading && !error && searched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Search className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/35">No matching items found for "{query}"</p>
            <p className="text-[10px] text-white/20 mt-1">Try another keyword or change your filter</p>
          </motion.div>
        )}

        {!loading && !error && !searched && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">Unified Workspace Search</p>
            <p className="text-[10px] text-white/25 mt-1">Type above to instantly search across notes, tasks, calendar & email</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/8 flex-shrink-0 flex items-center justify-between text-[10px] text-white/30">
        <span>Instant Search Index</span>
        <span>{total > 0 ? `${total} items` : 'Workspace connected'}</span>
      </div>
    </GlassPanel>
  );
}

export default SearchPanel;
