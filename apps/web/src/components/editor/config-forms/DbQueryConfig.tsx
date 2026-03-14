import { useEffect, useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';

function serializeParams(params: unknown): string {
  if (!Array.isArray(params)) {
    return '[]';
  }

  return JSON.stringify(params, null, 2);
}

interface DbQueryConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function DbQueryConfig({ config, onChange }: DbQueryConfigProps) {
  const { messages } = useLocale();
  const [paramsText, setParamsText] = useState(() => serializeParams(config.params));
  const [paramsError, setParamsError] = useState<string | null>(null);

  useEffect(() => {
    setParamsText(serializeParams(config.params));
  }, [config.params]);

  function handleParamsChange(nextValue: string) {
    setParamsText(nextValue);

    try {
      const parsed = JSON.parse(nextValue);

      if (!Array.isArray(parsed)) {
        setParamsError(messages.configForms.dbQuery.jsonArrayError);
        return;
      }

      onChange((prev) => ({ ...prev, params: parsed }));
      setParamsError(null);
    } catch {
      setParamsError(messages.configForms.dbQuery.validJsonError);
    }
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">{messages.configForms.dbQuery.query}</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, query: value }));
          }}
          placeholder={messages.configForms.dbQuery.queryPlaceholder}
          value={typeof config.query === 'string' ? config.query : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">{messages.configForms.dbQuery.params}</span>
        <textarea
          className="mt-2 min-h-32 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => handleParamsChange(event.target.value)}
          placeholder={messages.configForms.dbQuery.paramsPlaceholder}
          value={paramsText}
        />
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {messages.configForms.dbQuery.help}
        </span>
        {paramsError ? (
          <span className="mt-2 block text-xs font-semibold text-rose-600">
            {paramsError}
          </span>
        ) : null}
      </label>
    </div>
  );
}
