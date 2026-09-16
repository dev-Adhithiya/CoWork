export function GlassToggle({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full border transition-colors disabled:opacity-40 ${enabled ? 'bg-blue-500/70 border-blue-300/50' : 'bg-white/10 border-white/15'}`}
      title={enabled ? 'Disable' : 'Enable'}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
