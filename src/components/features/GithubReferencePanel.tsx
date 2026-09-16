import { ExternalLink, Github, X } from 'lucide-react';

export interface GithubReference {
  repo: string;
  number: number;
  title?: string;
  state?: string;
  author?: string;
  url?: string;
  kind?: string;
  labels?: string[];
}

export function GithubReferencePanel({ reference, onClose }: { reference: GithubReference; onClose: () => void }) {
  return (
    <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-sm border-l border-white/10 bg-[#0b1220]/95 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Github className="h-4 w-4" /> GitHub reference</div>
        <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" title="Close reference"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-8">
        <p className="text-xs text-white/40">{reference.repo} #{reference.number}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{reference.title || 'GitHub reference'}</h2>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{reference.kind || 'reference'}</span>
          {reference.state && <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">{reference.state}</span>}
          {reference.author && <span>by {reference.author}</span>}
        </div>
        {reference.labels && <div className="mt-4 flex flex-wrap gap-1">{reference.labels.map((label) => <span key={label} className="rounded bg-white/10 px-2 py-1 text-[11px] text-white/55">{label}</span>)}</div>}
        {reference.url && <a href={reference.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-2 text-xs text-blue-100 hover:bg-blue-500/30">Open on GitHub <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
    </aside>
  );
}
