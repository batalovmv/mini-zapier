import { useMemo } from 'react';

import type { PreviewEmptyReason } from '../../hooks/usePreviewData';
import { useLocale } from '../../locale/LocaleProvider';
import {
  resolveTemplateSegments,
  type ResolvedSegment,
} from '../../lib/template-resolve';

interface PreviewField {
  label: string;
  template: string;
  multiline?: boolean;
}

interface MessagePreviewProps {
  fields: PreviewField[];
  inputData: unknown | null;
  source: 'test-run' | 'execution' | null;
  reason: PreviewEmptyReason | null;
  errorMessage?: string | null;
  loading: boolean;
}

function ResolvedText({ segments }: { segments: ResolvedSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.value}</span>;

        if (seg.resolved !== null) {
          return (
            <span
              key={i}
              className="rounded bg-amber-50 px-0.5 text-amber-800"
            >
              {seg.resolved}
            </span>
          );
        }

        return (
          <span
            key={i}
            className="rounded bg-slate-100 px-0.5 text-slate-400"
          >
            {seg.raw}
          </span>
        );
      })}
    </>
  );
}

export function MessagePreview({
  fields,
  inputData,
  source,
  reason,
  errorMessage = null,
  loading,
}: MessagePreviewProps) {
  const { messages } = useLocale();
  const t = messages.configForms.messagePreview;

  const resolved = useMemo(() => {
    if (inputData === null || inputData === undefined) return null;

    return fields.map((f) => ({
      label: f.label,
      multiline: f.multiline ?? false,
      segments: resolveTemplateSegments(f.template, inputData),
    }));
  }, [fields, inputData]);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
        {t.loading}
      </div>
    );
  }

  if (reason === 'load-error') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs leading-5 text-rose-700">
        {t.loadError(errorMessage ?? t.loadErrorFallback)}
      </div>
    );
  }

  // Empty state
  if (resolved === null) {
    let message = t.empty;

    if (reason === 'trigger-action') message = t.emptyTriggerAction;
    else if (reason === 'version-mismatch' || reason === 'structural-change')
      message = t.stale;

    return (
      <p className="py-3 text-xs leading-5 text-slate-400">{message}</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Source badge */}
      {source ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
          {source === 'test-run' ? t.sourceTest : t.sourceExecution}
        </span>
      ) : null}

      {resolved.map((field, i) => (
        <div key={i}>
          <span className="text-xs font-medium text-slate-500">
            {field.label}
          </span>
          <div
            className={`mt-1 rounded-xl border border-slate-900/10 bg-slate-50/80 px-3 py-2 text-xs leading-5 text-slate-800 ${
              field.multiline ? 'whitespace-pre-wrap font-mono' : ''
            }`}
          >
            <ResolvedText segments={field.segments} />
          </div>
        </div>
      ))}
    </div>
  );
}
