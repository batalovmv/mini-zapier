import { useEffect, useRef, useState } from 'react';

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

/** Methods that typically carry a request body. */
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Try to parse a body string as a flat JSON object suitable for key-value editing.
 * Returns null if the body is not valid JSON or contains nested values.
 */
function tryParseBodyAsKv(body: unknown): [string, string][] | null {
  if (typeof body !== 'string' || body.trim() === '') return null;
  try {
    const parsed = JSON.parse(body) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const entries = Object.entries(parsed);
    // Only allow flat string values for visual mode
    if (entries.every(([, v]) => typeof v === 'string')) {
      return entries.map(([k, v]) => [k, v as string]);
    }
    return null;
  } catch {
    return null;
  }
}

/** Check if body is parseable as flat KV. */
function isBodyKvCompatible(body: unknown): boolean {
  if (typeof body !== 'string' || body.trim() === '') return true; // empty = compatible
  return tryParseBodyAsKv(body) !== null;
}

/** Serialize key-value pairs back to a JSON body string (only non-empty keys). */
function kvToBody(entries: [string, string][]): string {
  const obj: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (k.trim().length > 0) {
      obj[k] = v;
    }
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : '';
}

function getHeaderEntries(config: Record<string, unknown>): [string, string][] {
  const headers = toStringRecord(config.headers);
  const entries = Object.entries(headers);
  return entries.length > 0 ? entries : [['', '']];
}

/** Check if Content-Type header is already set (case-insensitive). */
function hasContentType(config: Record<string, unknown>): boolean {
  const headers = toStringRecord(config.headers);
  return Object.keys(headers).some(
    (k) => k.toLowerCase() === 'content-type',
  );
}

interface HttpRequestConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function HttpRequestConfig({
  config,
  onChange,
}: HttpRequestConfigProps) {
  const { messages } = useLocale();
  const t = messages.configForms.httpRequest;

  const [showJson, setShowJson] = useState(false);
  const [bodyMode, setBodyMode] = useState<'fields' | 'json'>(() =>
    isBodyKvCompatible(config.body) ? 'fields' : 'json',
  );
  const [headersOpen, setHeadersOpen] = useState(() =>
    Object.keys(toStringRecord(config.headers)).length > 0,
  );
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    Object.keys(toStringRecord(config.headers)).length > 0,
  );

  // Track extra empty placeholder rows (local UI state, not persisted).
  const [extraBodyRows, setExtraBodyRows] = useState(0);

  // Re-sync bodyMode when body changes externally (e.g. node switch, RawJsonFallback edit).
  // If body becomes incompatible with fields mode, force switch to json.
  // If body becomes compatible while in json mode, keep json (user chose it).
  const prevBodyRef = useRef(config.body);
  useEffect(() => {
    if (config.body !== prevBodyRef.current) {
      prevBodyRef.current = config.body;
      if (bodyMode === 'fields' && !isBodyKvCompatible(config.body)) {
        setBodyMode('json');
      }
      // Reset extra rows on external body change
      setExtraBodyRows(0);
    }
  }, [config.body, bodyMode]);

  useEffect(() => {
    if (Object.keys(toStringRecord(config.headers)).length > 0) {
      setHeadersOpen(true);
      setAdvancedOpen(true);
    }
  }, [config.headers]);

  const method = typeof config.method === 'string' ? config.method : 'POST';
  const hasBody = BODY_METHODS.has(method);
  const headerEntries = getHeaderEntries(config);
  const storedHeaderCount = Object.keys(toStringRecord(config.headers)).length;

  // --- Body key-value entries (persisted fields + local empty placeholders) ---
  const bodyKv: [string, string][] = (() => {
    const parsed = tryParseBodyAsKv(config.body);
    const persisted: [string, string][] =
      parsed !== null && parsed.length > 0 ? parsed : [];
    // Append local-only empty placeholder rows
    const result = [...persisted];
    for (let i = 0; i < extraBodyRows; i++) {
      result.push(['', '']);
    }
    // Always show at least one row
    return result.length > 0 ? result : [['', '']];
  })();

  // --- Header helpers ---
  function updateHeaderKey(index: number, newKey: string) {
    onChange((prev) => {
      const entries = getHeaderEntries(prev);
      const next = [...entries];
      next[index] = [newKey, entries[index]?.[1] ?? ''];
      return {
        ...prev,
        headers: Object.fromEntries(next.filter(([k]) => k.trim().length > 0)),
      };
    });
  }

  function updateHeaderValue(index: number, newValue: string) {
    onChange((prev) => {
      const entries = getHeaderEntries(prev);
      const next = [...entries];
      next[index] = [entries[index]?.[0] ?? '', newValue];
      return {
        ...prev,
        headers: Object.fromEntries(next.filter(([k]) => k.trim().length > 0)),
      };
    });
  }

  function removeHeader(index: number) {
    onChange((prev) => {
      const entries = getHeaderEntries(prev);
      const next = entries.filter((_, i) => i !== index);
      return {
        ...prev,
        headers: Object.fromEntries(next.filter(([k]) => k.trim().length > 0)),
      };
    });
  }

  function addHeader() {
    onChange((prev) => ({
      ...prev,
      headers: { ...toStringRecord(prev.headers), '': '' },
    }));
  }

  // --- Body KV helpers ---
  // Count of persisted (non-empty-key) entries for index math
  function getPersistedCount(): number {
    const parsed = tryParseBodyAsKv(config.body);
    return parsed !== null ? parsed.length : 0;
  }

  function updateBodyKey(index: number, newKey: string) {
    const persistedCount = getPersistedCount();

    if (index >= persistedCount) {
      // This row was a local placeholder — now it has a key, so persist it
      setExtraBodyRows((r) => Math.max(0, r - 1));
    }

    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [];
      // If editing a placeholder row beyond current entries, extend
      while (entries.length <= index) {
        entries.push(['', '']);
      }
      entries[index] = [newKey, entries[index]?.[1] ?? ''];
      return { ...prev, body: kvToBody(entries) };
    });
  }

  function updateBodyValue(index: number, newValue: string) {
    const persistedCount = getPersistedCount();

    if (index >= persistedCount) {
      // Placeholder row — value edit alone doesn't persist (key is still empty)
      // Just keep it local for now; kvToBody will strip empty keys anyway
      return;
    }

    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [];
      entries[index] = [entries[index]?.[0] ?? '', newValue];
      return { ...prev, body: kvToBody(entries) };
    });
  }

  function removeBodyField(index: number) {
    const persistedCount = getPersistedCount();

    if (index >= persistedCount) {
      // Remove a local placeholder row
      setExtraBodyRows((r) => Math.max(0, r - 1));
      return;
    }

    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [];
      const next = entries.filter((_, i) => i !== index);
      return { ...prev, body: kvToBody(next) };
    });
  }

  function addBodyField() {
    // Add a local-only empty row — not persisted until key is filled
    setExtraBodyRows((r) => r + 1);
  }

  // --- Content-Type auto-suggest ---
  const showContentTypeHint = hasBody && !hasContentType(config);

  return (
    <div className="space-y-5">
      <div className="space-y-5 rounded-[1.25rem] border border-slate-900/10 bg-white px-4 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
            {t.mainEyebrow}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t.mainDescription}
          </p>
        </div>

        <label className="block">
          <span className="muted-label">{t.method}</span>
          <select
            aria-label={t.methodAriaLabel}
            className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(event) => {
              const value = event.target.value;
              onChange((prev) => ({ ...prev, method: value }));
            }}
            value={method}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>

        <TemplatedField
          ariaLabel={t.urlAriaLabel}
          config={config}
          configKey="url"
          label={t.url}
          onChange={onChange}
          placeholder={t.urlPlaceholder}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="muted-label">{t.body}</span>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {hasBody
                  ? bodyMode === 'fields'
                    ? t.bodyFieldsHint
                    : t.bodyJsonHint
                  : t.bodyOptionalHint}
              </p>
            </div>

            {hasBody ? (
              <div className="inline-flex flex-wrap gap-1 rounded-full border border-slate-900/10 bg-slate-50 p-1">
                <button
                  aria-pressed={bodyMode === 'fields'}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    bodyMode === 'fields'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    setBodyMode('fields');
                    setExtraBodyRows(0);
                  }}
                  type="button"
                >
                  {t.editBodyAsFields}
                </button>
                <button
                  aria-pressed={bodyMode === 'json'}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    bodyMode === 'json'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    setBodyMode('json');
                    setExtraBodyRows(0);
                  }}
                  type="button"
                >
                  {t.editBodyAsJson}
                </button>
              </div>
            ) : null}
          </div>

          {showContentTypeHint ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-5 text-amber-700">
              {t.contentTypeHint}
            </div>
          ) : null}

          {hasBody ? (
            bodyMode === 'fields' ? (
              <div className="space-y-3">
                {bodyKv.map(([key, value], index) => (
                  <div
                    key={`b-${index}`}
                    className="space-y-2 rounded-2xl border border-slate-900/10 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={t.bodyKeyAriaLabel(index + 1)}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                        onChange={(event) =>
                          updateBodyKey(index, event.target.value)
                        }
                        placeholder={t.bodyKeyPlaceholder}
                        type="text"
                        value={key}
                      />
                      <button
                        aria-label={t.removeBodyRowAriaLabel(index + 1)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => removeBodyField(index)}
                        title={t.remove}
                        type="button"
                      >
                        &times;
                      </button>
                    </div>

                    <TemplatedField
                      ariaLabel={t.bodyValueAriaLabel(index + 1)}
                      label=""
                      onValueChange={(v) => updateBodyValue(index, v)}
                      placeholder={t.bodyValuePlaceholder}
                      value={value}
                    />
                  </div>
                ))}

                <button
                  className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
                  onClick={addBodyField}
                  type="button"
                >
                  {t.addBodyField}
                </button>
              </div>
            ) : (
              <TemplatedField
                ariaLabel={t.bodyAriaLabel}
                config={config}
                configKey="body"
                label=""
                multiline
                onChange={onChange}
                placeholder={t.bodyPlaceholder}
              />
            )
          ) : (
            <TemplatedField
              ariaLabel={t.bodyAriaLabel}
              config={config}
              configKey="body"
              label=""
              multiline
              onChange={onChange}
              placeholder={t.bodyPlaceholder}
            />
          )}
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              {t.advancedEyebrow}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t.advancedDescription}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700"
            data-testid="http-advanced-toggle"
            onClick={() => setAdvancedOpen((value) => !value)}
            type="button"
          >
            {advancedOpen ? t.hideAdvanced : t.showAdvanced}
          </button>
        </div>

        {advancedOpen ? (
          <div className="mt-4 space-y-4 border-t border-slate-900/10 pt-4">
            <div className="rounded-2xl border border-slate-900/10 bg-white px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="muted-label">{t.headers}</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {storedHeaderCount > 0
                      ? t.headersCount(storedHeaderCount)
                      : t.headersHint}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700"
                  data-testid="http-headers-toggle"
                  onClick={() => setHeadersOpen((value) => !value)}
                  type="button"
                >
                  {headersOpen ? t.hideAdvancedHeaders : t.showAdvancedHeaders}
                </button>
              </div>

              {headersOpen ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      {t.headers}
                    </span>
                    <button
                      className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
                      data-testid="http-add-header-button"
                      onClick={addHeader}
                      type="button"
                    >
                      {t.addHeader}
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {headerEntries.map(([key, value], index) => (
                      <div
                        key={`h-${key}-${index}`}
                        className="space-y-2 rounded-2xl border border-slate-900/10 bg-slate-50/60 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            aria-label={t.headerKeyAriaLabel(index + 1)}
                            className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                            onChange={(event) =>
                              updateHeaderKey(index, event.target.value)
                            }
                            placeholder={t.headerNamePlaceholder}
                            type="text"
                            value={key}
                          />
                          <button
                            aria-label={t.removeHeaderRowAriaLabel(index + 1)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => removeHeader(index)}
                            title={t.remove}
                            type="button"
                          >
                            &times;
                          </button>
                        </div>

                        {key.trim().length > 0 ? (
                          <TemplatedField
                            ariaLabel={t.headerValueAriaLabel(index + 1)}
                            label=""
                            onValueChange={(v) => updateHeaderValue(index, v)}
                            placeholder={t.headerValuePlaceholder}
                            value={value}
                          />
                        ) : (
                          <input
                            aria-label={t.headerValueAriaLabel(index + 1)}
                            className="w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                            onChange={(event) =>
                              updateHeaderValue(index, event.target.value)
                            }
                            placeholder={t.headerValuePlaceholder}
                            type="text"
                            value={value}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <RawJsonFallback
              config={config}
              hideLabel={t.hideJson}
              onChange={onChange}
              onToggle={() => setShowJson((v) => !v)}
              open={showJson}
              showLabel={t.showJson}
              variant="embedded"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
