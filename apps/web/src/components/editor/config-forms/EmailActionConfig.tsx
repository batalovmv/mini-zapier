import type { ConfigUpdater } from '../ConfigPanel';

interface EmailActionConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function EmailActionConfig({
  config,
  onChange,
}: EmailActionConfigProps) {
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">To</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, to: value }));
          }}
          placeholder="ops@example.com"
          type="email"
          value={typeof config.to === 'string' ? config.to : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">Subject</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, subject: value }));
          }}
          placeholder="New order {{input.id}}"
          type="text"
          value={typeof config.subject === 'string' ? config.subject : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">Body</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, body: value }));
          }}
          placeholder="Hello, {{input.customerName}}"
          value={typeof config.body === 'string' ? config.body : ''}
        />
      </label>
    </div>
  );
}
