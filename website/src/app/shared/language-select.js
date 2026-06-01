export function LanguageSelect({ language, label, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface/78 px-3 py-2 text-sm font-semibold text-text-secondary shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-border-strong bg-background px-3 py-1.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
        aria-label={label}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </label>
  );
}
