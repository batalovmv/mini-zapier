import { useMemo, useState } from 'react';

import { usePreviewData } from '../../../hooks/usePreviewData';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { MessagePreview } from '../MessagePreview';
import { TemplatedField } from '../templated-input';
import { RawJsonFallback } from './RawJsonFallback';

interface EmailActionConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

const secondarySectionClass =
  'editor-inspector-panel editor-inspector-panel-secondary px-3 py-3';

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
    <div className="min-w-0 space-y-4">
      <div className="space-y-4">
        <div className="editor-inspector-copy">
          <p className="editor-inspector-eyebrow">{t.mainEyebrow}</p>
          <p className="editor-inspector-note">{t.mainDescription}</p>
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
