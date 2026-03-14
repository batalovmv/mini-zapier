import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';

interface CronConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function CronConfig({ config, onChange }: CronConfigProps) {
  const { messages } = useLocale();

  return (
    <label className="block">
      <span className="muted-label">{messages.configForms.cron.label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
        onChange={(event) => {
          const value = event.target.value;
          onChange((prev) => ({ ...prev, cronExpression: value }));
        }}
        placeholder={messages.configForms.cron.placeholder}
        type="text"
        value={typeof config.cronExpression === 'string' ? config.cronExpression : ''}
      />
      <span className="mt-2 block text-xs leading-5 text-slate-500">
        {messages.configForms.cron.help}
      </span>
    </label>
  );
}
