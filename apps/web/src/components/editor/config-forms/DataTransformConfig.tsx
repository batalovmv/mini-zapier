function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

interface DataTransformConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export function DataTransformConfig({
  config,
  onChange,
}: DataTransformConfigProps) {
  const mode = config.mode === 'mapping' ? 'mapping' : 'template';
  const mapping = toStringRecord(config.mapping);
  const mappingEntries =
    Object.entries(mapping).length > 0
      ? Object.entries(mapping)
      : [['', '']];

  function updateMapping(index: number, key: string, value: string) {
    const nextEntries = [...mappingEntries];
    nextEntries[index] = [key, value];

    onChange({
      ...config,
      mode: 'mapping',
      mapping: Object.fromEntries(
        nextEntries.filter(([entryKey]) => entryKey.trim().length > 0),
      ),
    });
  }

  function removeMapping(index: number) {
    const nextEntries = mappingEntries.filter(
      (_, entryIndex) => entryIndex !== index,
    );

    onChange({
      ...config,
      mode: 'mapping',
      mapping: Object.fromEntries(
        nextEntries.filter(([entryKey]) => entryKey.trim().length > 0),
      ),
    });
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">Mode</span>
        <select
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) =>
            onChange({
              ...config,
              mode: event.target.value,
            })
          }
          value={mode}
        >
          <option value="template">Template</option>
          <option value="mapping">Mapping</option>
        </select>
      </label>

      {mode === 'template' ? (
        <label className="block">
          <span className="muted-label">Template</span>
          <textarea
            className="mt-2 min-h-36 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(event) =>
              onChange({
                ...config,
                mode: 'template',
                template: event.target.value,
              })
            }
            placeholder='{"name":"{{input.name}}"}'
            value={typeof config.template === 'string' ? config.template : ''}
          />
        </label>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">Mapping</span>
            <button
              className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
              onClick={() =>
                onChange({
                  ...config,
                  mode: 'mapping',
                  mapping: {
                    ...mapping,
                    '': '',
                  },
                })
              }
              type="button"
            >
              Add field
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {mappingEntries.map(([key, value], index) => (
              <div
                key={`${key}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
              >
                <input
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) =>
                    updateMapping(index, event.target.value, value)
                  }
                  placeholder="Field"
                  type="text"
                  value={key}
                />
                <input
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) =>
                    updateMapping(index, key, event.target.value)
                  }
                  placeholder="{{input.field}}"
                  type="text"
                  value={value}
                />
                <button
                  className="rounded-2xl border border-slate-900/10 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => removeMapping(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
