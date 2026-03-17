import { useEffect, useRef, useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
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
  const { messages } = useLocale();
  const t = messages.configForms.rawJson;
  const [raw, setRaw] = useState(() => JSON.stringify(config, null, 2));
  const [error, setError] = useState<string | null>(null);
  const lastPushedRef = useRef<string | null>(null);

  // Sync from config → raw when config changes externally (e.g. node switch)
  // Skip if config matches what we last pushed via onChange (our own edit echo)
  useEffect(() => {
    if (open) {
      const incoming = JSON.stringify(config, null, 2);
      if (incoming !== lastPushedRef.current) {
        setRaw(incoming);
        setError(null);
      }
      // Clear after each effect so the guard only suppresses the immediate
      // echo from our own onChange call, not future external changes.
      lastPushedRef.current = null;
    }
  }, [open, config]);

  function handleRawChange(value: string) {
    setRaw(value);
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError(t.mustBeObject);
        return;
      }
      setError(null);
      lastPushedRef.current = JSON.stringify(parsed, null, 2);
      onChange(() => parsed);
    } catch {
      setError(t.invalidJson);
    }
  }

  return (
    <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
            {t.expertEyebrow}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t.expertDescription}
          </p>
        </div>
        <button
          className="shrink-0 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700"
          onClick={onToggle}
          type="button"
        >
          {open ? hideLabel : showLabel}
        </button>
      </div>

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
