import { useMemo, useState } from 'react';

import { usePreviewData } from '../../../hooks/usePreviewData';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { MessagePreview } from '../MessagePreview';
import { RawJsonFallback } from './RawJsonFallback';
import { TemplatedField } from '../templated-input';

interface EmailActionConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function EmailActionConfig({
  config,
  onChange,
}: EmailActionConfigProps) {
  const { messages } = useLocale();
  const t = messages.configForms.emailAction;
  const tp = messages.configForms.messagePreview;
  const [showJson, setShowJson] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const preview = usePreviewData(showPreview);

  const previewFields = useMemo(
    () => [
      { label: t.to, template: String(config.to ?? '') },
      { label: t.subject, template: String(config.subject ?? '') },
      { label: t.body, template: String(config.body ?? ''), multiline: true },
    ],
    [config.to, config.subject, config.body, t.to, t.subject, t.body],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-5 rounded-[1.25rem] border border-slate-900/10 bg-white px-4 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
            {t.mainEyebrow}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t.mainDescription}
          </p>
        </div>

        <TemplatedField
          config={config}
          configKey="to"
          label={t.to}
          onChange={onChange}
          placeholder={t.toPlaceholder}
        />

        <TemplatedField
          config={config}
          configKey="subject"
          label={t.subject}
          onChange={onChange}
          placeholder={t.subjectPlaceholder}
        />

        <TemplatedField
          config={config}
          configKey="body"
          label={t.body}
          multiline
          onChange={onChange}
          placeholder={t.bodyPlaceholder}
        />
      </div>

      <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              {t.previewEyebrow}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t.previewDescription}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700"
            onClick={() => setShowPreview((v) => !v)}
            type="button"
          >
            {showPreview ? `▾ ${tp.toggle}` : `▸ ${tp.toggle}`}
          </button>
        </div>

        {showPreview ? (
          <div className="mt-4 border-t border-slate-900/10 pt-4">
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
      </div>

      <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              {t.advancedEyebrow}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t.advancedDescription}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700"
            onClick={() => setAdvancedOpen((v) => !v)}
            type="button"
          >
            {advancedOpen ? t.hideAdvanced : t.showAdvanced}
          </button>
        </div>

        {advancedOpen ? (
          <div className="mt-4 border-t border-slate-900/10 pt-4">
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
      </div>
    </div>
  );
}
