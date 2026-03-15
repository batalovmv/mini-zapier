import { useEffect, useState } from 'react';

import type { ConfigUpdater } from '../ConfigPanel';

interface RawJsonFallbackProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
  open: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

export function RawJsonFallback({
  config,
  onChange,
  open,
  onToggle,
  showLabel,
  hideLabel,
}: RawJsonFallbackProps) {
  const [raw, setRaw] = useState(() => JSON.stringify(config, null, 2));
  const [error, setError] = useState<string | null>(null);

  // Sync from config → raw when config changes externally
  useEffect(() => {
    if (open) {
      setRaw(JSON.stringify(config, null, 2));
      setError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRawChange(value: string) {
    setRaw(value);
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Must be a JSON object');
        return;
      }
      setError(null);
      onChange(() => parsed);
    } catch {
      setError('Invalid JSON');
    }
  }

  return (
    <div>
      <button
        className="text-xs text-slate-400 transition hover:text-slate-600"
        onClick={onToggle}
        type="button"
      >
        {open ? hideLabel : showLabel}
      </button>

      {open && (
        <div className="mt-2">
          <textarea
            className={`min-h-36 w-full rounded-2xl border bg-white px-4 py-3 font-mono text-xs text-slate-900 outline-none transition ${
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-900/10 focus:border-amber-500'
            }`}
            onChange={(e) => handleRawChange(e.target.value)}
            value={raw}
          />
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
