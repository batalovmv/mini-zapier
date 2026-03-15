import { useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { RawJsonFallback } from './RawJsonFallback';
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
  const t = messages.configForms.telegram;
  const [showJson, setShowJson] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="block">
        <div className="flex items-center justify-between">
          <span className="muted-label">{t.chatId}</span>
          <button
            className="text-xs text-amber-600 transition hover:text-amber-700"
            onClick={() => setHelperOpen((v) => !v)}
            type="button"
          >
            {t.chatIdHelper}
          </button>
        </div>

        {helperOpen && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 whitespace-pre-line">
            {t.chatIdHelperSteps}
          </div>
        )}

        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) => {
            const value = event.target.value;
            onChange((prev) => ({ ...prev, chatId: value }));
          }}
          placeholder={t.chatIdPlaceholder}
          type="text"
          value={typeof config.chatId === 'string' ? config.chatId : ''}
        />
      </div>

      <TemplatedField
        config={config}
        configKey="message"
        label={t.message}
        multiline
        onChange={onChange}
        placeholder={t.messagePlaceholder}
      />

      <RawJsonFallback
        config={config}
        onChange={onChange}
        open={showJson}
        onToggle={() => setShowJson((v) => !v)}
        showLabel={t.showJson}
        hideLabel={t.hideJson}
      />
    </div>
  );
}
