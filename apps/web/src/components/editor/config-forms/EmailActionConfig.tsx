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
