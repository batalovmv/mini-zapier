import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input';

interface TelegramConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function TelegramConfig({
  config,
  onChange,
}: TelegramConfigProps) {
  const { messages } = useLocale();

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">{messages.configForms.telegram.chatId}</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, chatId: value }));
          }}
          placeholder={messages.configForms.telegram.chatIdPlaceholder}
          type="text"
          value={typeof config.chatId === 'string' ? config.chatId : ''}
        />
      </label>

      <TemplatedField
        config={config}
        configKey="message"
        label={messages.configForms.telegram.message}
        multiline
        onChange={onChange}
        placeholder={messages.configForms.telegram.messagePlaceholder}
      />
    </div>
  );
}
