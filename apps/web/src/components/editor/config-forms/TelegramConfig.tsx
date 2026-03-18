import { useMemo, useState } from 'react';

import { usePreviewData } from '../../../hooks/usePreviewData';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { MessagePreview } from '../MessagePreview';
import { TemplatedField } from '../templated-input';
import { RawJsonFallback } from './RawJsonFallback';

interface TelegramConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

const secondarySectionClass =
  'editor-inspector-panel editor-inspector-panel-secondary px-3 py-3';

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    <div className="min-w-0 space-y-4">
      <div className="space-y-4">
        <div className="editor-inspector-copy">
          <p className="editor-inspector-eyebrow">{t.mainEyebrow}</p>
          <p className="editor-inspector-note">{t.mainDescription}</p>
        </div>

        <div className="block">
          <span className="muted-label">{t.chatId}</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-900/10 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(event) => {
              const value = event.target.value;
              onChange((prev) => ({ ...prev, chatId: value }));
            }}
            placeholder={t.chatIdPlaceholder}
            type="text"
            value={typeof config.chatId === 'string' ? config.chatId : ''}
          />

          <div className="mt-2 rounded-xl border border-dashed border-slate-900/10 bg-slate-50/70 px-3 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <p className="min-w-0 flex-1 text-xs leading-5 text-slate-500">
                {t.chatIdHelperHint}
              </p>
              <button
                className="editor-inspector-toggle"
                onClick={() => setHelperOpen((v) => !v)}
                type="button"
              >
                {helperOpen ? t.hideChatIdHelp : t.showChatIdHelp}
              </button>
            </div>

            {helperOpen ? (
              <div className="mt-2 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs leading-5 text-amber-900">
                {t.chatIdHelperSteps}
              </div>
            ) : null}
          </div>
        </div>

        <TemplatedField
          config={config}
          configKey="message"
          label={t.message}
          multiline
          onChange={onChange}
          placeholder={t.messagePlaceholder}
        />
      </div>

      <section className={secondarySectionClass}>
        <div className="editor-inspector-panel-head">
          <div className="editor-inspector-copy">
            <p className="editor-inspector-eyebrow">{t.previewEyebrow}</p>
            <p className="editor-inspector-note">{t.previewDescription}</p>
          </div>
          <button
            className="editor-inspector-toggle"
            onClick={() => setShowPreview((v) => !v)}
            type="button"
          >
            {showPreview ? `▾ ${tp.toggle}` : `▸ ${tp.toggle}`}
          </button>
        </div>

        {showPreview ? (
          <div className="mt-3 border-t border-slate-900/8 pt-3">
            <MessagePreview
              errorMessage={preview.errorMessage}
              fields={previewFields}
              inputData={preview.inputData}
              loading={preview.loading}
              reason={preview.reason}
              source={preview.source}
            />
          </div>
        ) : null}
      </section>

      <section className={secondarySectionClass}>
        <div className="editor-inspector-panel-head">
          <div className="editor-inspector-copy">
            <p className="editor-inspector-eyebrow">{t.advancedEyebrow}</p>
            <p className="editor-inspector-note">{t.advancedDescription}</p>
          </div>
          <button
            className="editor-inspector-toggle"
            onClick={() => setAdvancedOpen((v) => !v)}
            type="button"
          >
            {advancedOpen ? t.hideAdvanced : t.showAdvanced}
          </button>
        </div>

        {advancedOpen ? (
          <div className="mt-3 border-t border-slate-900/8 pt-3">
            <RawJsonFallback
              config={config}
              onChange={onChange}
              open={showJson}
              onToggle={() => setShowJson((v) => !v)}
              showLabel={t.showJson}
              hideLabel={t.hideJson}
              variant="embedded"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
