import type { ConfigUpdater } from '../ConfigPanel';

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
  const headers = toStringRecord(config.headers);
  const headerEntries =
    Object.entries(headers).length > 0
      ? Object.entries(headers)
      : [['', '']];

  function updateHeader(index: number, key: string, value: string) {
    onChange((prev) => {
      const currentHeaders = toStringRecord(prev.headers);
      const entries =
        Object.entries(currentHeaders).length > 0
          ? Object.entries(currentHeaders)
          : [['', '']];
      const nextEntries = [...entries];
      nextEntries[index] = [key, value];
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
      <label className="block">
        <span className="muted-label">URL</span>
        <input
          aria-label="HTTP request URL"
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, url: value }));
          }}
          placeholder="https://example.com/orders/{{input.id}}"
          type="text"
          value={typeof config.url === 'string' ? config.url : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">Method</span>
        <select
          aria-label="HTTP request method"
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
          <span className="muted-label">Headers</span>
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
            Add header
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {headerEntries.map(([key, value], index) => (
            <div
              key={`${key}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
            >
                <input
                  aria-label={`Header key ${index + 1}`}
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) => updateHeader(index, event.target.value, value)}
                  placeholder="Header"
                type="text"
                value={key}
              />
                <input
                  aria-label={`Header value ${index + 1}`}
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) => updateHeader(index, key, event.target.value)}
                  placeholder="Value"
                type="text"
                value={value}
              />
              <button
                className="rounded-2xl border border-slate-900/10 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => removeHeader(index)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="muted-label">Body</span>
        <textarea
          aria-label="HTTP request body"
          className="mt-2 min-h-36 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, body: value }));
          }}
          placeholder='{"orderId":"{{input.id}}"}'
          value={typeof config.body === 'string' ? config.body : ''}
        />
      </label>
    </div>
  );
}
