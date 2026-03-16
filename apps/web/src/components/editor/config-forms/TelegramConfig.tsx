import { useMemo, useState } from 'react';

import { usePreviewData } from '../../../hooks/usePreviewData';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { MessagePreview } from '../MessagePreview';
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
  const tp = messages.configForms.messagePreview;
  const [showJson, setShowJson] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const preview = usePreviewData(showPreview);

  const previewFields = useMemo(
    () => [
      {
        label: t.message,
        template: String(config.message ?? ''),
        multiline: true,
      },
    ],
    [config.message, t.message],
  );

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

      {/* Message Preview */}
      <div>
        <button
          className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
          onClick={() => setShowPreview((v) => !v)}
          type="button"
        >
          {showPreview ? `▾ ${tp.toggle}` : `▸ ${tp.toggle}`}
        </button>

        {showPreview ? (
          <div className="mt-2">
            <MessagePreview
              fields={previewFields}
              inputData={preview.inputData}
              loading={preview.loading}
              reason={preview.reason}
              source={preview.source}
            />
          </div>
        ) : null}
      </div>

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
