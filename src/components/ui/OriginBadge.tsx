import { Bot, Check } from 'lucide-react';

export function AiSuggestedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-violet-300/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-200"><Bot className="h-3 w-3" /> AI suggested</span>;
}

export function ConfirmedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"><Check className="h-3 w-3" /> Confirmed</span>;
}
