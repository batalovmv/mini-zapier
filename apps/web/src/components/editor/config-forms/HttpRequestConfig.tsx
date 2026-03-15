import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input';

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

interface HttpRequestConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function HttpRequestConfig({
  config,
  onChange,
}: HttpRequestConfigProps) {
  const { messages } = useLocale();

  const headers = toStringRecord(config.headers);
  const headerEntries =
    Object.entries(headers).length > 0
      ? Object.entries(headers)
      : [['', '']];

  function updateHeaderKey(index: number, newKey: string) {
    onChange((prev) => {
      const currentHeaders = toStringRecord(prev.headers);
      const entries =
        Object.entries(currentHeaders).length > 0
          ? Object.entries(currentHeaders)
          : [['', '']];
      const nextEntries = [...entries];
      nextEntries[index] = [newKey, entries[index]?.[1] ?? ''];
      return {
        ...prev,
        headers: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  function updateHeaderValue(index: number, newValue: string) {
    onChange((prev) => {
      const currentHeaders = toStringRecord(prev.headers);
      const entries =
        Object.entries(currentHeaders).length > 0
          ? Object.entries(currentHeaders)
          : [['', '']];
      const nextEntries = [...entries];
      nextEntries[index] = [entries[index]?.[0] ?? '', newValue];
      return {
        ...prev,
        headers: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  function removeHeader(index: number) {
    onChange((prev) => {
      const currentHeaders = toStringRecord(prev.headers);
      const entries =
        Object.entries(currentHeaders).length > 0
          ? Object.entries(currentHeaders)
          : [['', '']];
      const nextEntries = entries.filter((_, i) => i !== index);
      return {
        ...prev,
        headers: Object.fromEntries(
          nextEntries.filter(([k]) => k.trim().length > 0),
        ),
      };
    });
  }

  return (
    <div className="space-y-5">
      <TemplatedField
        ariaLabel={messages.configForms.httpRequest.urlAriaLabel}
        config={config}
        configKey="url"
        label={messages.configForms.httpRequest.url}
        onChange={onChange}
        placeholder={messages.configForms.httpRequest.urlPlaceholder}
      />

      <label className="block">
        <span className="muted-label">{messages.configForms.httpRequest.method}</span>
        <select
          aria-label={messages.configForms.httpRequest.methodAriaLabel}
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, method: value }));
          }}
          value={typeof config.method === 'string' ? config.method : 'POST'}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="muted-label">{messages.configForms.httpRequest.headers}</span>
          <button
            className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
            onClick={() =>
              onChange((prev) => ({
                ...prev,
                headers: {
                  ...toStringRecord(prev.headers),
                  '': '',
                },
              }))
            }
            type="button"
          >
            {messages.configForms.httpRequest.addHeader}
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {headerEntries.map(([key, value], index) => (
            <div
              key={`${key}-${index}`}
              className="space-y-2 rounded-2xl border border-slate-900/10 bg-slate-50/60 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  aria-label={messages.configForms.httpRequest.headerKeyAriaLabel(index + 1)}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) => updateHeaderKey(index, event.target.value)}
                  placeholder={messages.configForms.httpRequest.headerNamePlaceholder}
                  type="text"
                  value={key}
                />
                <button
                  aria-label={messages.configForms.httpRequest.removeHeaderRowAriaLabel(index + 1)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => removeHeader(index)}
                  title={messages.configForms.httpRequest.remove}
                  type="button"
                >
                  &times;
                </button>
              </div>

              {key.trim().length > 0 ? (
                <TemplatedField
                  ariaLabel={messages.configForms.httpRequest.headerValueAriaLabel(index + 1)}
                  label=""
                  onValueChange={(v) => updateHeaderValue(index, v)}
                  placeholder={messages.configForms.httpRequest.headerValuePlaceholder}
                  value={value}
                />
              ) : (
                <input
                  aria-label={messages.configForms.httpRequest.headerValueAriaLabel(index + 1)}
                  className="w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) => updateHeaderValue(index, event.target.value)}
                  placeholder={messages.configForms.httpRequest.headerValuePlaceholder}
                  type="text"
                  value={value}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <TemplatedField
        ariaLabel={messages.configForms.httpRequest.bodyAriaLabel}
        config={config}
        configKey="body"
        label={messages.configForms.httpRequest.body}
        multiline
        onChange={onChange}
        placeholder={messages.configForms.httpRequest.bodyPlaceholder}
      />
    </div>
  );
}
