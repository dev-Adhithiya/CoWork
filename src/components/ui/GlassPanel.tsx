import type { ReactNode } from 'react';

export function GlassPanel({ children, className = '', variant = 'strong' }: { children: ReactNode; className?: string; variant?: 'strong' | 'subtle' | 'default' }) {
  const variantClass = variant === 'subtle' ? 'glass-subtle' : variant === 'default' ? 'glass' : 'glass-strong';
  return <div className={`${variantClass} ${className}`}>{children}</div>;
}

export default GlassPanel;
