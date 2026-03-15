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

/** Serialize key-value pairs back to a JSON body string. */
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
  const [bodyMode, setBodyMode] = useState<'fields' | 'json'>(() => {
    // Default to fields mode if body is empty or parseable as flat KV
    const body = config.body;
    if (typeof body !== 'string' || body.trim() === '') return 'fields';
    return tryParseBodyAsKv(body) !== null ? 'fields' : 'json';
  });

  const method = typeof config.method === 'string' ? config.method : 'POST';
  const hasBody = BODY_METHODS.has(method);
  const headerEntries = getHeaderEntries(config);

  // --- Body key-value state ---
  const bodyKv: [string, string][] = (() => {
    const parsed = tryParseBodyAsKv(config.body);
    if (parsed !== null && parsed.length > 0) return parsed;
    return [['', '']];
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
  function updateBodyKey(index: number, newKey: string) {
    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [['', '']];
      entries[index] = [newKey, entries[index]?.[1] ?? ''];
      return { ...prev, body: kvToBody(entries) };
    });
  }

  function updateBodyValue(index: number, newValue: string) {
    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [['', '']];
      entries[index] = [entries[index]?.[0] ?? '', newValue];
      return { ...prev, body: kvToBody(entries) };
    });
  }

  function removeBodyField(index: number) {
    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [['', '']];
      const next = entries.filter((_, i) => i !== index);
      return { ...prev, body: kvToBody(next) };
    });
  }

  function addBodyField() {
    onChange((prev) => {
      const parsed = tryParseBodyAsKv(prev.body);
      const entries: [string, string][] =
        parsed && parsed.length > 0 ? [...parsed] : [];
      entries.push(['', '']);
      // We need to keep the empty-key entry temporarily for the UI
      // kvToBody strips empties, so store as raw JSON with empty key
      const obj: Record<string, string> = {};
      for (const [k, v] of entries) {
        obj[k] = v;
      }
      return { ...prev, body: JSON.stringify(obj, null, 2) };
    });
  }

  // --- Content-Type auto-suggest ---
  const showContentTypeHint = hasBody && !hasContentType(config);

  return (
    <div className="space-y-5">
      {/* URL */}
      <TemplatedField
        ariaLabel={t.urlAriaLabel}
        config={config}
        configKey="url"
        label={t.url}
        onChange={onChange}
        placeholder={t.urlPlaceholder}
      />

      {/* Method */}
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

      {/* Content-Type hint */}
      {showContentTypeHint && (
        <p className="text-xs text-amber-600">{t.contentTypeHint}</p>
      )}

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="muted-label">{t.headers}</span>
          <button
            className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
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
                  onChange={(event) => updateHeaderKey(index, event.target.value)}
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
                  onChange={(event) => updateHeaderValue(index, event.target.value)}
                  placeholder={t.headerValuePlaceholder}
                  type="text"
                  value={value}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      {hasBody && (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">{t.body}</span>
            <button
              className="text-xs text-slate-400 transition hover:text-slate-600"
              onClick={() =>
                setBodyMode((prev) => (prev === 'fields' ? 'json' : 'fields'))
              }
              type="button"
            >
              {bodyMode === 'fields' ? t.editBodyAsJson : t.editBodyAsFields}
            </button>
          </div>

          {bodyMode === 'fields' ? (
            <div className="mt-3 space-y-3">
              {bodyKv.map(([key, value], index) => (
                <div
                  key={`b-${key}-${index}`}
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
            <div className="mt-3">
              <TemplatedField
                ariaLabel={t.bodyAriaLabel}
                config={config}
                configKey="body"
                label=""
                multiline
                onChange={onChange}
                placeholder={t.bodyPlaceholder}
              />
            </div>
          )}
        </div>
      )}

      {/* Body for non-body methods (GET, DELETE) — still show raw textarea */}
      {!hasBody && (
        <TemplatedField
          ariaLabel={t.bodyAriaLabel}
          config={config}
          configKey="body"
          label={t.body}
          multiline
          onChange={onChange}
          placeholder={t.bodyPlaceholder}
        />
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
