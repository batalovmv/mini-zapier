import { useRef } from 'react';

import type { ConfigUpdater } from '../ConfigPanel';
import { FieldPicker, insertAtCursor, insertAtCursorRecord } from '../FieldPicker';

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
  onChange: ConfigUpdater;
}

export function DataTransformConfig({
  config,
  onChange,
}: DataTransformConfigProps) {
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const mappingValueRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mode = config.mode === 'mapping' ? 'mapping' : 'template';
  const mapping = toStringRecord(config.mapping);
  const mappingEntries =
    Object.entries(mapping).length > 0
      ? Object.entries(mapping)
      : [['', '']];

  function updateMappingKey(index: number, newKey: string) {
    onChange((prev) => {
      const currentMapping = toStringRecord(prev.mapping);
      const entries =
        Object.entries(currentMapping).length > 0
          ? Object.entries(currentMapping)
          : [['', '']];
      const nextEntries = [...entries];
      nextEntries[index] = [newKey, entries[index]?.[1] ?? ''];
      return {
        ...prev,
        mode: 'mapping',
        mapping: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  function updateMappingValue(index: number, newValue: string) {
    onChange((prev) => {
      const currentMapping = toStringRecord(prev.mapping);
      const entries =
        Object.entries(currentMapping).length > 0
          ? Object.entries(currentMapping)
          : [['', '']];
      const nextEntries = [...entries];
      nextEntries[index] = [entries[index]?.[0] ?? '', newValue];
      return {
        ...prev,
        mode: 'mapping',
        mapping: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  function removeMapping(index: number) {
    onChange((prev) => {
      const currentMapping = toStringRecord(prev.mapping);
      const entries =
        Object.entries(currentMapping).length > 0
          ? Object.entries(currentMapping)
          : [['', '']];
      const nextEntries = entries.filter((_, i) => i !== index);
      return {
        ...prev,
        mode: 'mapping',
        mapping: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">Mode</span>
        <select
          aria-label="Data transform mode"
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, mode: value }));
          }}
          value={mode}
        >
          <option value="template">Template</option>
          <option value="mapping">Mapping</option>
        </select>
      </label>

      {mode === 'template' ? (
        <div className="block">
          <div className="flex items-center justify-between">
            <span className="muted-label">Template</span>
            <FieldPicker
              onSelect={(f) =>
                insertAtCursor(templateRef, f, 'template', config, onChange)
              }
            />
          </div>
          <textarea
            aria-label="Data transform template"
            className="mt-2 min-h-36 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(event) => {
              const value = event.target.value;
              onChange((prev) => ({
                ...prev,
                mode: 'template',
                template: value,
              }));
            }}
            placeholder='{"name":"{{input.name}}"}'
            ref={templateRef}
            value={typeof config.template === 'string' ? config.template : ''}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">Mapping</span>
            <button
              className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  mode: 'mapping',
                  mapping: {
                    ...toStringRecord(prev.mapping),
                    '': '',
                  },
                }))
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
                className="space-y-2 rounded-2xl border border-slate-900/10 bg-slate-50/60 p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Mapping key ${index + 1}`}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                    onChange={(event) =>
                      updateMappingKey(index, event.target.value)
                    }
                    placeholder="key"
                    type="text"
                    value={key}
                  />
                  <button
                    aria-label={`Remove mapping row ${index + 1}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => removeMapping(index)}
                    title="Remove"
                    type="button"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Mapping value ${index + 1}`}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                    onChange={(event) =>
                      updateMappingValue(index, event.target.value)
                    }
                    placeholder="value"
                    ref={(el) => {
                      mappingValueRefs.current[index] = el;
                    }}
                    type="text"
                    value={value}
                  />
                  {key.trim().length > 0 ? (
                    <FieldPicker
                      onSelect={(f) =>
                        insertAtCursorRecord(
                          mappingValueRefs.current[index],
                          f,
                          'mapping',
                          key,
                          config,
                          onChange,
                          toStringRecord,
                        )
                      }
                    />
                  ) : (
                    <div className="h-6 w-6 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
