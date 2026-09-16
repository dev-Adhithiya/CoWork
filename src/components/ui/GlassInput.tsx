import type { ChangeEventHandler } from 'react';

type InputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  label?: string;
  placeholder?: string;
  type?: string;
  className?: string;
};

type TextareaProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  label?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
};

export function GlassInput({ className = '', type = 'text', label, ...props }: InputProps) {
  const input = <input type={type} className={`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none ${className}`} {...props} />;
  if (!label) return input;
  return <label className="grid gap-1 text-xs text-white/55"><span>{label}</span>{input}</label>;
}

export function GlassTextarea({ className = '', rows = 3, label, ...props }: TextareaProps) {
  const textarea = <textarea rows={rows} className={`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none resize-none ${className}`} {...props} />;
  if (!label) return textarea;
  return <label className="grid gap-1 text-xs text-white/55"><span>{label}</span>{textarea}</label>;
}
