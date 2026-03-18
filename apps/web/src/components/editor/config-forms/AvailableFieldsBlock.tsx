import { useMemo } from 'react';

import type { PreviewData } from '../../../hooks/usePreviewData';
import { useLocale } from '../../../locale/LocaleProvider';

interface AvailableFieldsBlockProps {
  preview: PreviewData;
}

/**
 * Compact read-only block listing the top-level keys of the upstream step
 * output. Shown as a quiet secondary helper in config forms so the user
 * knows which `{{input.field}}` references are available.
 */
export function AvailableFieldsBlock({ preview }: AvailableFieldsBlockProps) {
  const { messages } = useLocale();
  const t = messages.configForms.availableFields;

  const fields = useMemo(() => {
    if (
      preview.inputData !== null &&
      typeof preview.inputData === 'object' &&
      !Array.isArray(preview.inputData)
    ) {
      return Object.keys(preview.inputData as Record<string, unknown>);
    }
    return [];
  }, [preview.inputData]);

  const hasData = fields.length > 0;
  const sourceBadge =
    preview.source === 'test-run'
      ? t.sourceTest
      : preview.source === 'execution'
        ? t.sourceExecution
        : null;

  return (
    <section className="editor-inspector-panel editor-inspector-panel-secondary px-3 py-3">
      <div className="editor-inspector-copy">
        <p className="editor-inspector-eyebrow">{t.eyebrow}</p>
        <p className="editor-inspector-note">{t.description}</p>
      </div>

      <div className="mt-2">
        {preview.loading ? (
          <p className="text-xs text-slate-400">{t.loading}</p>
        ) : hasData ? (
          <div className="space-y-1.5">
            {sourceBadge && (
              <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {sourceBadge}
              </span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {fields.map((key) => (
                <code
                  key={key}
                  className="rounded-md border border-slate-900/8 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                >
                  {key}
                </code>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">{t.emptyHint}</p>
        )}
      </div>
    </section>
  );
}
