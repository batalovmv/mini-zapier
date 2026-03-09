interface CronConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export function CronConfig({ config, onChange }: CronConfigProps) {
  return (
    <label className="block">
      <span className="muted-label">Cron expression</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
        onChange={(event) =>
          onChange({
            ...config,
            cronExpression: event.target.value,
          })
        }
        placeholder="*/5 * * * *"
        type="text"
        value={typeof config.cronExpression === 'string' ? config.cronExpression : ''}
      />
      <span className="mt-2 block text-xs leading-5 text-slate-500">
        Stored as-is and validated by the API on save.
      </span>
    </label>
  );
}
