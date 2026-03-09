import { useEffect, useState } from 'react';

function serializeParams(params: unknown): string {
  if (!Array.isArray(params)) {
    return '[]';
  }

  return JSON.stringify(params, null, 2);
}

interface DbQueryConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export function DbQueryConfig({ config, onChange }: DbQueryConfigProps) {
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
        setParamsError('Params must be a JSON array.');
        return;
      }

      onChange({
        ...config,
        params: parsed,
      });
      setParamsError(null);
    } catch {
      setParamsError('Params must be valid JSON.');
    }
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">SQL query</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) =>
            onChange({
              ...config,
              query: event.target.value,
            })
          }
          placeholder="select * from orders where id = $1"
          value={typeof config.query === 'string' ? config.query : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">Params</span>
        <textarea
          className="mt-2 min-h-32 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => handleParamsChange(event.target.value)}
          placeholder='["{{input.id}}"]'
          value={paramsText}
        />
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          Provide a JSON array. Template strings are resolved by the worker.
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
