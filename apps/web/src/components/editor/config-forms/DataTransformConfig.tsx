import { useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input';

import { RawJsonFallback } from './RawJsonFallback';

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
  const { messages } = useLocale();
  const t = messages.configForms.dataTransform;

  const [showJson, setShowJson] = useState(false);

  const mode = config.mode === 'mapping' ? 'mapping' : 'template';
  const mapping = toStringRecord(config.mapping);
  const mappingEntries =
    Object.entries(mapping).length > 0
      ? Object.entries(mapping)
      : [['', '']];
  const modeButtonClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-slate-900 text-white shadow-sm'
        : 'bg-white text-slate-600 hover:bg-slate-100'
    }`;

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
      <div>
        <span className="muted-label">{t.mode}</span>
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-[1.3rem] border border-slate-900/10 bg-slate-50 p-1">
          <button
            aria-pressed={mode === 'template'}
            className={modeButtonClass(mode === 'template')}
            onClick={() => onChange((prev) => ({ ...prev, mode: 'template' }))}
            type="button"
          >
            {t.templateMode}
          </button>
          <button
            aria-pressed={mode === 'mapping'}
            className={modeButtonClass(mode === 'mapping')}
            onClick={() => onChange((prev) => ({ ...prev, mode: 'mapping' }))}
            type="button"
          >
            {t.mappingMode}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {mode === 'template' ? t.templateModeHint : t.mappingModeHint}
        </p>
      </div>

      {mode === 'template' ? (
        <TemplatedField
          ariaLabel={t.templateAriaLabel}
          config={config}
          configKey="template"
          label={t.template}
          multiline
          onChange={onChange}
          placeholder={t.templatePlaceholder}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">{t.mapping}</span>
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
              {t.addField}
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
                    aria-label={t.mappingKeyAriaLabel(index + 1)}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                    onChange={(event) =>
                      updateMappingKey(index, event.target.value)
                    }
                    placeholder={t.keyPlaceholder}
                    type="text"
                    value={key}
                  />
                  <button
                    aria-label={t.removeMappingRowAriaLabel(index + 1)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => removeMapping(index)}
                    title={t.remove}
                    type="button"
                  >
                    &times;
                  </button>
                </div>

                {key.trim().length > 0 ? (
                  <TemplatedField
                    ariaLabel={t.mappingValueAriaLabel(index + 1)}
                    label=""
                    onValueChange={(v) => updateMappingValue(index, v)}
                    placeholder={t.valuePlaceholder}
                    value={value}
                  />
                ) : (
                  <input
                    aria-label={t.mappingValueAriaLabel(index + 1)}
                    className="w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder={t.valuePlaceholder}
                    type="text"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON fallback */}
      <RawJsonFallback
        config={config}
        hideLabel={t.hideJson}
        onChange={onChange}
        onToggle={() => setShowJson((v) => !v)}
        open={showJson}
        showLabel={t.showJson}
      />
    </div>
  );
}
